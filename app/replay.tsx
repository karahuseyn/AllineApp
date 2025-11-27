import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const [history, setHistory] = useState<GameHistoryStep[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(100); // ms per step (Faster default)
    const [cellSize, setCellSize] = useState(0);
    const [walls, setWalls] = useState<WallData[]>([]); // Walls are static usually, but we can extract from grid if needed. 
    // Actually walls are not in history explicitly as objects, only in grid.
    // But for replay we might need them. 
    // Wait, captureGridState takes currentWalls. But doesn't save them explicitly in step.
    // It saves them in 'grid'.
    // If we want to render Wall components, we need to extract them from grid.

    const timerRef = useRef<any>(null);

    // Calculate Cell Size
    const onLayout = (e: any) => {
        const { width, height } = e.nativeEvent.layout;
        const size = Math.floor((Math.min(width, height) - (GAP * (GRID_COLS - 1))) / GRID_COLS);
        setCellSize(size);
    };

    // File Upload Handler
    const handleFileUpload = (event: any) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (Array.isArray(json)) {
                    setHistory(json);
                    setCurrentIndex(0);
                    setIsPlaying(false);

                    // Extract walls from the first frame (assuming walls don't move)
                    // Grid: 1 = Wall
                    const firstGrid = json[0].grid;
                    const extractedWalls: WallData[] = [];
                    for (let y = 0; y < GRID_ROWS; y++) {
                        for (let x = 0; x < GRID_COLS; x++) {
                            if (firstGrid[y][x] === 1) {
                                extractedWalls.push({ x, y, type: (x + y) % 7 }); // Type is guessed
                            }
                        }
                    }
                    setWalls(extractedWalls);
                } else {
                    alert('Invalid JSON format');
                }
            } catch (err) {
                alert('Error parsing JSON');
            }
        };
        reader.readAsText(file);
    };

    // Playback Loop
    useEffect(() => {
        if (isPlaying && currentIndex < history.length - 1) {
            timerRef.current = setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, speed);
        } else if (currentIndex >= history.length - 1) {
            setIsPlaying(false);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPlaying, currentIndex, history, speed]);

    const currentStep = history[currentIndex];
    const gridContainerSize = cellSize > 0 ? (cellSize * GRID_COLS) + (GAP * (GRID_COLS - 1)) : 0;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={[COLORS.bg, '#000']}
                style={styles.background}
            />

            {/* Header Removed as requested */}
            {/* Header Removed as requested */}
            <View style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
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
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }}>BACK</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Controls / Upload */}
                <View style={styles.sidebar}>
                    <View style={styles.panel}>
                        <Text style={styles.label}>Load Game Data</Text>
                        {Platform.OS === 'web' && (
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                style={{ color: '#fff', marginBottom: 20 }}
                            />
                        )}

                        <Text style={styles.info}>
                            Step: {currentIndex + 1} / {history.length}
                        </Text>
                        <Text style={styles.info}>
                            Move: {currentStep?.move || '-'}
                        </Text>
                        {currentStep?.label && (
                            <Text style={{ color: COLORS.neonBlue, fontWeight: 'bold', marginTop: 5 }}>
                                LABEL: {currentStep.label}
                            </Text>
                        )}

                        <View style={styles.controls}>
                            <TouchableOpacity
                                style={[styles.btn, history.length === 0 && styles.disabled]}
                                onPress={() => setIsPlaying(!isPlaying)}
                                disabled={history.length === 0}
                            >
                                <Text style={styles.btnText}>{isPlaying ? 'PAUSE' : 'PLAY'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btn, history.length === 0 && styles.disabled]}
                                onPress={() => { setCurrentIndex(0); setIsPlaying(false); }}
                                disabled={history.length === 0}
                            >
                                <Text style={styles.btnText}>RESET</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Speed: {speed}ms</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => setSpeed(Math.max(100, speed - 100))} style={styles.speedBtn}><Text style={styles.btnText}>+</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setSpeed(speed + 100)} style={styles.speedBtn}><Text style={styles.btnText}>-</Text></TouchableOpacity>
                        </View>
                    </View>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
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
        gap: 20
    },
    sidebar: {
        width: 300,
        justifyContent: 'center'
    },
    panel: {
        backgroundColor: 'rgba(30,30,40,0.8)',
        padding: 20,
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
        marginBottom: 10,
        fontSize: 16
    },
    info: {
        color: '#ccc',
        marginBottom: 5,
        fontFamily: 'monospace'
    },
    controls: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
        marginBottom: 20
    },
    btn: {
        flex: 1,
        backgroundColor: COLORS.grad2,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    speedBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 8,
        width: 40,
        alignItems: 'center'
    },
    disabled: {
        opacity: 0.5
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold'
    }
});
