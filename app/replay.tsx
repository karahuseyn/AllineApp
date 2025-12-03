
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { TEXTS } from '../constants/Texts';
import { Block, COLORS, GAP, GRID_COLS, GRID_ROWS, Wall } from './index';

// Interfaces (Redefined locally as they are not exported from index.tsx)
interface WallData { x: number; y: number; type: number; }
interface BlockData { id: number; char: string; x: number; y: number; highlight: string | null; }
interface GameHistoryStep {
    move: string;
    grid: (string | number)[][];
    timestamp: number;
    label?: string;
    blocks?: BlockData[];
}

export default function Replay() {
    const router = useRouter();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isPortrait = windowHeight > windowWidth;
    const isMobile = windowWidth < 768;

    const params = useLocalSearchParams();
    const lang = (params.lang as string) || 'EN';
    const t = TEXTS[lang as keyof typeof TEXTS] || TEXTS['EN'];

    const [history, setHistory] = useState<GameHistoryStep[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(100); // ms per step (Faster default)
    const [cellSize, setCellSize] = useState(0);
    const [walls, setWalls] = useState<WallData[]>([]);

    const timerRef = useRef<any>(null);

    // Calculate Cell Size
    const onLayout = (e: any) => {
        const { width, height } = e.nativeEvent.layout;
        // Safety check for zero dimensions
        if (width === 0 || height === 0) return;

        const availableW = width - 20;
        const availableH = height - 20;

        const sizeW = Math.floor((availableW - (GAP * (GRID_COLS - 1))) / GRID_COLS);
        const sizeH = Math.floor((availableH - (GAP * (GRID_COLS - 1))) / GRID_COLS);

        setCellSize(Math.min(sizeW, sizeH));
    };

    // File Upload Handler
    const handleFileUpload = async (event?: any) => {
        if (Platform.OS === 'web') {
            // WEB LOGIC
            const file = event?.target?.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target?.result as string);
                    processGameData(json);
                } catch (err) {
                    alert('Error parsing JSON');
                }
            };
            reader.readAsText(file);
        } else {
            // NATIVE LOGIC (Android/iOS)
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: 'application/json',
                    copyToCacheDirectory: true
                });

                if (result.canceled) return;

                const fileUri = result.assets[0].uri;
                const fileContent = await FileSystem.readAsStringAsync(fileUri);
                const json = JSON.parse(fileContent);
                processGameData(json);
            } catch (err) {
                alert('Error loading file: ' + err);
            }
        }
    };

    const processGameData = (json: any) => {
        if (Array.isArray(json)) {
            setHistory(json);
            setCurrentIndex(0);
            setIsPlaying(false);

            // Extract walls from the first frame
            const firstGrid = json[0].grid;
            const extractedWalls: WallData[] = [];
            for (let y = 0; y < GRID_ROWS; y++) {
                for (let x = 0; x < GRID_COLS; x++) {
                    const cell = firstGrid[y][x];
                    if (typeof cell === 'number') {
                        if (cell >= 10) {
                            extractedWalls.push({ x, y, type: cell - 10 });
                        } else if (cell === 1) {
                            extractedWalls.push({ x, y, type: (x + y) % 7 }); // Fallback
                        }
                    }
                }
            }
            setWalls(extractedWalls);
        } else {
            alert('Invalid JSON format');
        }
    };

    // Playback Loop
    useEffect(() => {
        if (isPlaying && currentIndex < history.length - 1) {
            const currentStep = history[currentIndex];
            // Pause for 1 second if aligned
            const isAligned = currentStep.move === 'ALIGNED' || currentStep.label === 'aligned-output';
            const delay = isAligned ? 1000 : speed;

            timerRef.current = setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, delay);
        } else if (currentIndex >= history.length - 1) {
            setIsPlaying(false);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPlaying, currentIndex, history, speed]);

    const currentStep = history[currentIndex];
    const gridContainerSize = cellSize > 0 ? (cellSize * GRID_COLS) + (GAP * (GRID_COLS - 1)) : 0;
    const isFinished = history.length > 0 && currentIndex === history.length - 1;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={[COLORS.bg, '#000']}
                style={styles.background}
            />

            {/* MOBILE LANDSCAPE WARNING OVERLAY */}
            {Platform.OS === 'web' && isMobile && !isPortrait && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.bg, zIndex: 9999, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 60, height: 100, borderWidth: 4, borderColor: COLORS.neonBlue, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, transform: [{ rotate: '90deg' }] }}>
                        <Text style={{ fontSize: 40 }}>📱</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', maxWidth: 300 }}>
                        {t.rotateDevice}
                    </Text>
                </View>
            )}

            {/* Header / Back Button (Relative Flow) */}
            <View style={{ padding: 20, paddingBottom: 10, zIndex: 10 }}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={{ alignSelf: 'flex-start' }}>
                    <LinearGradient
                        colors={[COLORS.grad1, COLORS.grad2]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{
                            paddingVertical: 12,
                            paddingHorizontal: 24,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.3)',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 8 }}>←</Text>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }}>{t.back}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={[styles.content, { flexDirection: isPortrait ? 'column' : 'row' }]}>
                {/* Controls / Upload */}
                <View style={[styles.sidebar, { width: isPortrait ? '100%' : 300, maxHeight: isPortrait ? '40%' : '100%' }]}>
                    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                        <View style={styles.panel}>
                            <Text style={styles.label}>{t.loadGameData}</Text>
                            {Platform.OS === 'web' ? (
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    style={{ color: '#fff', marginBottom: 20 }}
                                />
                            ) : (
                                <TouchableOpacity
                                    style={[styles.btn, { marginBottom: 20, backgroundColor: COLORS.neonBlue }]}
                                    onPress={handleFileUpload}
                                >
                                    <Text style={[styles.btnText, { color: '#000', fontSize: 14 }]}>{t.uploadGameData}</Text>
                                </TouchableOpacity>
                            )}

                            <Text style={styles.info}>
                                {t.step}: {currentIndex + 1} / {history.length}
                            </Text>
                            <Text style={styles.info}>
                                {t.move}: <Text style={currentStep?.move === 'ALIGNED' ? { color: COLORS.neonCyan, fontWeight: 'bold' } : {}}>{currentStep?.move || '-'}</Text>
                            </Text>

                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={[styles.btn, history.length === 0 && styles.disabled]}
                                    onPress={() => {
                                        if (isFinished) {
                                            setCurrentIndex(0);
                                            setIsPlaying(true);
                                        } else {
                                            setIsPlaying(!isPlaying);
                                        }
                                    }}
                                    disabled={history.length === 0}
                                >
                                    <Text style={styles.btnText}>{isFinished ? t.replay : (isPlaying ? t.pause : t.play)}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.btn, (history.length === 0 || isFinished) && styles.disabled]}
                                    onPress={() => { setCurrentIndex(0); setIsPlaying(false); }}
                                    disabled={history.length === 0 || isFinished}
                                >
                                    <Text style={styles.btnText}>{t.reset}</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>{t.speed}: {speed}ms</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity onPress={() => setSpeed(Math.max(100, speed - 100))} style={styles.speedBtn}><Text style={styles.btnText}>+</Text></TouchableOpacity>
                                <TouchableOpacity onPress={() => setSpeed(speed + 100)} style={styles.speedBtn}><Text style={styles.btnText}>-</Text></TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Grid */}
                <View style={styles.gridArea} onLayout={onLayout}>
                    {gridContainerSize > 0 && (
                        <View style={{ width: gridContainerSize + 6, height: gridContainerSize + 6 }}>
                            <LinearGradient
                                colors={[COLORS.grad1, COLORS.grad2, COLORS.grad3]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={{ flex: 1, borderRadius: 16, padding: 3 }}
                            >
                                <View style={{ flex: 1, backgroundColor: COLORS.grid, borderRadius: 13, position: 'relative' }}>
                                    {/* Grid Cells */}
                                    {Array.from({ length: 100 }).map((_, i) => {
                                        const cx = i % 10;
                                        const cy = Math.floor(i / 10);
                                        return (
                                            <View
                                                key={i}
                                                style={{
                                                    position: 'absolute',
                                                    left: cx * (cellSize + GAP),
                                                    top: cy * (cellSize + GAP),
                                                    width: cellSize, height: cellSize,
                                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                                    borderRadius: 3,
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(255,255,255,0.05)'
                                                }}
                                            />
                                        );
                                    })}

                                    {/* Walls */}
                                    {walls.map((w, i) => (
                                        <Wall key={`w-${i}`} x={w.x} y={w.y} type={w.type} cellSize={cellSize} />
                                    ))}

                                    {/* Blocks */}
                                    {currentStep?.blocks ? (
                                        // Render using Block components (Smooth)
                                        currentStep.blocks.map(b => (
                                            <Block
                                                key={b.id}
                                                id={b.id}
                                                char={b.char}
                                                x={b.x}
                                                y={b.y}
                                                highlightType={b.highlight}
                                                cellSize={cellSize}
                                            />
                                        ))
                                    ) : (
                                        // Fallback: Render from Grid (Static)
                                        currentStep?.grid.flatMap((row, y) =>
                                            row.map((cell, x) => {
                                                if (typeof cell === 'string') {
                                                    return (
                                                        <View
                                                            key={`b-${y}-${x}`}
                                                            style={{
                                                                position: 'absolute',
                                                                left: x * (cellSize + GAP),
                                                                top: y * (cellSize + GAP),
                                                                width: cellSize,
                                                                height: cellSize,
                                                                backgroundColor: '#fff',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                borderRadius: 4
                                                            }}
                                                        >
                                                            <Text style={{ fontWeight: 'bold', fontSize: cellSize * 0.6 }}>{cell}</Text>
                                                        </View>
                                                    );
                                                }
                                                return null;
                                            })
                                        )
                                    )}
                                </View>
                            </LinearGradient>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        flexDirection: 'column', // Explicit column layout
    },
    background: {
        position: 'absolute',
        left: 0, right: 0, top: 0, bottom: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        justifyContent: 'space-between'
    },
    backBtn: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8
    },
    backBtnText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        padding: 20,
        gap: 20,
    },
    sidebar: {
        width: 300,
        justifyContent: 'center'
    },
    panel: {
        backgroundColor: 'rgba(30,30,40,0.8)',
        padding: 15, // Reduced from 20
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    gridArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    label: {
        color: COLORS.neonBlue,
        fontWeight: 'bold',
        marginBottom: 8,
        fontSize: 14 // Reduced from 16
    },
    info: {
        color: '#ccc',
        marginBottom: 4,
        fontFamily: 'monospace',
        fontSize: 12 // Added explicit smaller size
    },
    controls: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15,
        marginBottom: 15
    },
    btn: {
        flex: 1,
        backgroundColor: COLORS.grad2,
        padding: 10, // Reduced from 12
        borderRadius: 8,
        alignItems: 'center'
    },
    speedBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8, // Reduced from 10
        borderRadius: 8,
        width: 36,
        alignItems: 'center'
    },
    disabled: {
        opacity: 0.5
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12 // Added explicit smaller size
    }
});
