import MaskedView from '@react-native-masked-view/masked-view';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Modal,
  NativeModules,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import seedrandom from 'seedrandom';
import { GAME_DATA } from '../game_data';

// ... (existing imports)

// --- DİL VE METİN AYARLARI ---
const TEXTS = {
  TR: { score: 'PUAN', gameOver: 'OYUN BİTTİ', replay: 'TEKRAR OYNA', menu: 'ANA MENÜ', exit: 'ÇIKIŞ', paused: 'OYUN DURAKLATILDI', resume: 'DEVAM ET', aiDisclaimer: 'Bu veri yapay zeka modellerinin geliştirilmesinde kullanılacaktır. Anlayışınız için teşekkürler!', aiInstruction: 'Data\'yı indirdikten sonra ana sayfaya gidip Replay Viewer\'ı açabilir ve data\'yı yükleyerek oynadığınız oyunu tekrar izleyebilirsiniz.' },
  EN: { score: 'PTS', gameOver: 'GAME OVER', replay: 'PLAY AGAIN', menu: 'MAIN MENU', exit: 'EXIT', paused: 'GAME PAUSED', resume: 'RESUME', aiDisclaimer: 'This data will be used for the development of AI models. Thank you for your understanding!', aiInstruction: 'After downloading the data, you can go to the main page, open the Replay Viewer, upload the data, and watch your game replay.' },
  DE: { score: 'PKT', gameOver: 'SPIEL VORBEI', replay: 'NOCHMAL', menu: 'HAUPTMENÜ', exit: 'AUSGANG', paused: 'SPIEL PAUSIERT', resume: 'FORTSETZEN', aiDisclaimer: 'Diese Daten werden für die Entwicklung von KI-Modellen verwendet. Vielen Dank für Ihr Verständnis!', aiInstruction: 'Nach dem Herunterladen der Daten können Sie zur Hauptseite gehen, den Replay Viewer öffnen, die Daten hochladen und Ihr Spiel wiederholen.' },
  ES: { score: 'PTS', gameOver: 'JUEGO TERMINADO', replay: 'JUGAR DE NUEVO', menu: 'MENÚ PRINCIPAL', exit: 'SALIDA', paused: 'JUEGO PAUSADO', resume: 'REANUDAR', aiDisclaimer: 'Estos datos se utilizarán para el desarrollo de modelos de IA. ¡Gracias por su comprensión!', aiInstruction: 'Después de descargar los datos, puede ir a la página principal, abrir el Replay Viewer, cargar los datos y ver la repetición de su juego.' },
  FR: { score: 'PTS', gameOver: 'JEU TERMINÉ', replay: 'REJOUER', menu: 'MENU PRINCIPAL', exit: 'QUITTER', paused: 'JEU EN PAUSE', resume: 'REPRENDRE', aiDisclaimer: 'Ces données seront utilisées pour le développement de modèles d\'IA. Merci de votre compréhension !', aiInstruction: 'Après avoir téléchargé les données, vous pouvez aller sur la page principale, ouvrir le Replay Viewer, télécharger les données et regarder la rediffusion de votre jeu.' }
};

// ... (existing constants)

// ... inside component ...









// ==========================================
// 1. OYUN VERİSİ
// ==========================================
// ==========================================
// 1. OYUN VERİSİ (game_data.js'den geliyor)
// ==========================================

// --- AYARLAR ---
const { width, height } = Dimensions.get('window');
export const GRID_COLS = 10;
export const GRID_ROWS = 10;
export const GAP = 2;

// Grid Genişliği: Ekran - 20px
const MAX_GRID_WIDTH = width - 20;
const GRID_CELL_SIZE = Math.floor((MAX_GRID_WIDTH - (GAP * (GRID_COLS - 1))) / GRID_COLS);
const GRID_CONTAINER_SIZE = (GRID_CELL_SIZE * GRID_COLS) + (GAP * (GRID_COLS - 1));

export const COLORS = {
  bg: '#0f0f12',
  panel: 'rgba(30, 30, 40, 0.95)',
  grid: '#15151b',
  neonRed: '#ff2a6d',
  neonBlue: '#05d9e8',
  neonPurple: '#d602ee',
  neonGreen: '#39ff14',
  neonOrange: '#ff5e00',
  neonCyan: '#00fff2',
  accent: '#FFD700',
  success: '#00ff9d',
  text: '#ffffff',
  grad1: '#ff9f43',
  grad2: '#ff2a6d',
  grad3: '#00fff2'
};



const getTodayDate = () => new Date().toISOString().split('T')[0];

// --- YÖN SABİTLERİ ---
const DIRECTIONS = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 }
};

// --- BİLEŞENLER ---

interface GradientTextProps {
  text: string;
  style?: any;
  width?: number;
  height?: number;
  align?: 'flex-start' | 'center' | 'flex-end';
}

export const GradientText = React.memo(({ text, style, width = 120, height = 40, align = 'center' }: GradientTextProps) => {
  if (Platform.OS === 'web') {
    return (
      <View style={{ height: height, width: width, justifyContent: 'center', alignItems: align }}>
        <Text
          style={[
            style,
            {
              backgroundImage: `linear-gradient(90deg, ${COLORS.grad1}, ${COLORS.grad2}, ${COLORS.grad3})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent', // Fallback
              display: 'inline-block', // Ensures block-level gradient application on text
            } as any
          ]}
        >
          {text}
        </Text>
      </View>
    );
  }

  return (
    <MaskedView
      style={{ height: height, width: width }}
      maskElement={
        <View style={{ backgroundColor: 'transparent', flex: 1, justifyContent: 'center', alignItems: align }}>
          <Text style={[style, { color: 'black' }]}>{text}</Text>
        </View>
      }
    >
      <LinearGradient
        colors={[COLORS.grad1, COLORS.grad2, COLORS.grad3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </MaskedView>
  );
});

interface WallProps {
  x: number;
  y: number;
  type: number;
  cellSize: number;
}

export const Wall = React.memo(({ x, y, type, cellSize }: WallProps) => {
  const leftPos = x * (cellSize + GAP);
  const topPos = y * (cellSize + GAP);

  const style = useMemo(() => {
    const colors = [COLORS.neonRed, COLORS.neonBlue, COLORS.neonPurple, COLORS.accent, COLORS.neonGreen, COLORS.neonOrange, COLORS.neonCyan];
    return { color: colors[type % colors.length] };
  }, [type]);

  return (
    <View
      style={{
        position: 'absolute', left: leftPos, top: topPos, width: cellSize, height: cellSize, zIndex: 5,
        borderRadius: 3, borderWidth: 1, borderColor: style.color,
        backgroundColor: 'rgba(20,20,25,0.6)',
        justifyContent: 'center', alignItems: 'center'
      }}
    >
      <View style={{ width: '40%', height: '40%', backgroundColor: style.color, opacity: 0.4, borderRadius: 2 }} />
    </View>
  );
});

// Bloklar için Reanimated kullanımı
interface BlockProps {
  id: number;
  char: string;
  x: number;
  y: number;
  highlightType: string | null;
  cellSize: number;
}

export const Block = React.memo(({ id, char, x, y, highlightType, cellSize }: BlockProps) => {
  const targetX = x * (cellSize + GAP);
  const targetY = y * (cellSize + GAP);

  // Animasyon Değerleri
  const animX = useRef(new Animated.Value(targetX)).current;
  const animY = useRef(new Animated.Value(targetY)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Pozisyon değiştiğinde animasyonla git
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animX, {
        toValue: targetX,
        duration: 110, // Hızla eşleşmesi için (110ms)
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(animY, {
        toValue: targetY,
        duration: 110,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ]).start();
  }, [targetX, targetY]);

  // Highlight animasyonu
  useEffect(() => {
    if (highlightType) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 110, useNativeDriver: true })
      ]).start();
    }
  }, [highlightType]);

  const { bgColors, textColor, shadowColor, borderWidth, borderColor } = useMemo(() => {
    let bg = ['#ffffff', '#e0e0e0'];
    let txt = '#111';
    let shd = '#000';
    let bw = 0;
    let bc = 'transparent';

    if (highlightType === 'TARGET') {
      bg = ['#00ff9d', '#00cc7a']; txt = '#00331f'; shd = '#00ff9d'; bw = 2; bc = '#00ff9d';
    } else if (highlightType === 'BONUS') {
      bg = ['#00e5ff', '#00b8cc']; txt = '#004d57'; shd = '#00e5ff'; bw = 2; bc = '#00e5ff';
    } else if (highlightType === 'GOLD') {
      bg = ['#FFD700', '#FFAA00']; txt = '#5a3e00'; shd = '#FFD700'; bw = 2; bc = '#FFD700';
    } else if (highlightType === 'EPIC') {
      // Parlak Altın (7 Harfli)
      bg = ['#FFF700', '#FFD700', '#FFAC00']; // Daha parlak ve zengin
      txt = '#000000';
      shd = '#FFF700';
      bw = 3;
      bc = '#FFFFFF'; // Beyaz çerçeve ile patlasın
    } else if (highlightType === 'ALIGNED') {
      // RL Aligned Output (Parlak Mavi)
      bg = ['#00BFFF', '#1E90FF', '#0000FF'];
      txt = '#FFFFFF';
      shd = '#00BFFF';
      bw = 2;
      bc = '#FFFFFF';
    }
    return { bgColors: bg, textColor: txt, shadowColor: shd, borderWidth: bw, borderColor: bc };
  }, [highlightType]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: cellSize,
        height: cellSize,
        zIndex: highlightType ? 100 : 10,
        transform: [
          { translateX: animX },
          { translateY: animY },
          { scale: scaleAnim }
        ]
      }}
    >
      <LinearGradient
        colors={bgColors as any}
        style={{
          flex: 1, borderRadius: 5, justifyContent: 'center', alignItems: 'center',
          borderWidth, borderColor,
          ...Platform.select({
            web: { boxShadow: `0px 2px 4px ${shadowColor}` },
            default: { shadowColor: shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 }
          })
        }}
      >
        <Text style={{ fontWeight: '900', color: textColor, fontSize: Math.max(1, cellSize * 0.65) }}>{char}</Text>
      </LinearGradient>
    </Animated.View>
  );
});

// --- KAYAN YAZI (TICKER) ---
interface TickerProps {
  targets: string[];
  foundWords: Set<string>;
  width: number;
}

const Ticker = React.memo(({ targets, foundWords, width }: TickerProps) => {
  // Filter and Sort Targets
  const visibleTargets = useMemo(() => {
    // 1. Filter: Hide 7-letter words if not found
    const filtered = targets.filter(word => word.length < 7 || foundWords.has(word));

    // 2. Sort: Length ascending, but 7-letter words always at the end
    return filtered.sort((a, b) => {
      if (a.length === 7 && b.length !== 7) return 1; // a (7) goes to end
      if (b.length === 7 && a.length !== 7) return -1; // b (7) goes to end
      return a.length - b.length; // standard length sort
    });
  }, [targets, foundWords]);

  // WEB: Sidebar Mode
  if (Platform.OS === 'web') {
    return (
      <LinearGradient
        colors={[COLORS.grad1, COLORS.grad2, COLORS.grad3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 200, height: '100%', borderRadius: 12, padding: 2, marginLeft: 20 }}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.bg, borderRadius: 10, padding: 10 }}>
          {visibleTargets.map((word, index) => {
            const isFound = foundWords.has(word);
            const isEpic = word.length === 7;
            const borderColor = isFound ? (isEpic ? COLORS.accent : COLORS.success) : 'rgba(255,255,255,0.1)';
            const bgColor = isFound ? (isEpic ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 255, 157, 0.1)') : 'rgba(255,255,255,0.05)';
            const textColor = isFound ? (isEpic ? COLORS.accent : COLORS.success) : '#aaa';

            return (
              <View key={index} style={{ marginBottom: 8, padding: 6, backgroundColor: bgColor, borderRadius: 6, borderWidth: 1, borderColor: borderColor }}>
                <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14, textAlign: 'center', fontFamily: 'monospace' }}>
                  {isFound ? word : "_ ".repeat(word.length).trim()}
                </Text>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    );
  }

  // MOBILE: Original Ticker
  const scrollX = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (contentWidth > width && width > 0) {
      const duration = contentWidth * 20; // Kayma hızı
      const startAnimation = () => {
        scrollX.setValue(width);
        Animated.loop(
          Animated.timing(scrollX, {
            toValue: -contentWidth,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: Platform.OS !== 'web', // Web'de native driver sorun çıkarabilir
          })
        ).start();
      };
      startAnimation();
    }
  }, [contentWidth, width]);

  return (
    <View style={[styles.tickerContainer, { width: width }]}>
      <Animated.View
        style={[styles.tickerContent, { transform: [{ translateX: scrollX }] }]}
        onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
      >
        {visibleTargets.map((word, index) => {
          const isFound = foundWords.has(word);
          return (
            <View key={index} style={[styles.tickerItem, isFound && styles.tickerItemFound]}>
              <Text style={[styles.tickerText, isFound && { color: COLORS.success, textShadowColor: COLORS.success, textShadowRadius: 8 }]}>
                {isFound ? word : "_ ".repeat(word.length).trim()}
              </Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
});

// --- KONTROL BUTONU ---
// --- KONTROL BUTONU ---
interface ControlButtonProps {
  icon: string;
  onPressIn: () => void;
  onPressOut: () => void;
  style?: any;
}

export const ControlButton = React.memo(({ icon, onPressIn, onPressOut, style }: ControlButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.ctrlBtn, style]}
      activeOpacity={0.7}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      delayPressIn={0}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.3)']}
        style={styles.ctrlBtnGradient}
      >
        <Text style={styles.ctrlBtnText}>{icon}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
});

// --- FLOATING SCORE ---
interface FloatingScoreProps {
  amount: number;
  onComplete: () => void;
}

export const FloatingScore = React.memo(({ amount, onComplete }: FloatingScoreProps) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => onComplete());
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -150]
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0]
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.5, 1.2, 1]
  });

  return (
    <Animated.Text style={[styles.floatingScore, { opacity, transform: [{ translateY }, { scale }] }]}>
      +{amount}
    </Animated.Text>
  );
});

// --- CONFETTI PARTICLE ---
export const ConfettiParticle = React.memo(({ delay }: { delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const xVal = useRef(Math.random() * 300 - 150).current; // -150 to 150 spread
  const rotate = useRef(Math.random() * 360).current;
  const color = useRef(['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)]).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      })
    ]).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 600] // Fall down
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, xVal]
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1, 0]
  });

  const rotateStr = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rotate}deg`, `${rotate + 360 * 2}deg`]
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: -20,
        left: '50%',
        width: 8,
        height: 8,
        backgroundColor: color,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: rotateStr }]
      }}
    />
  );
});

export const ConfettiExplosion = React.memo(() => {
  const particles = Array.from({ length: 50 }).map((_, i) => i);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {particles.map(i => <ConfettiParticle key={i} delay={Math.random() * 500} />)}
    </View>
  );
});

export default function Index() {
  const router = useRouter();
  const [lang, setLang] = useState<string | null>(null);

  // State
  interface Wall { x: number; y: number; type: number; }
  interface Block { id: number; char: string; x: number; y: number; highlight: string | null; }
  interface GameData { id: number; date: string; source: string; targets: string[]; all_valid?: string[]; }

  // --- RL DATA COLLECTION ---
  interface GameHistoryStep {
    move: string; // 'START', 'T', 'B', 'R', 'L'
    grid: (string | number)[][];
    timestamp: number;
    label?: string; // 'aligned-output' etc.
    blocks?: Block[]; // For smooth replay
  }
  // Use Ref for history to avoid re-renders and performance issues
  const gameHistoryRef = useRef<GameHistoryStep[]>([]);

  const captureGridState = (move: string, currentWalls: Wall[], currentBlocks: Block[], label?: string) => {
    const grid: (string | number)[][] = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));

    // 1. Walls (1)
    currentWalls.forEach(w => {
      if (w.y < GRID_ROWS && w.x < GRID_COLS) grid[w.y][w.x] = 1;
    });

    // 2. Blocks (Char)
    currentBlocks.forEach(b => {
      if (b.y < GRID_ROWS && b.x < GRID_COLS) grid[b.y][b.x] = b.char;
    });

    const step: GameHistoryStep = {
      move,
      grid,
      timestamp: Date.now(),
      label,
      blocks: currentBlocks // Save full state
    };

    gameHistoryRef.current.push(step);
  };

  const downloadGameHistory = async () => {
    const dataStr = JSON.stringify(gameHistoryRef.current, null, 2);

    if (Platform.OS === 'web') {
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alline_game_data_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For Native (Android/iOS) - using Sharing or FileSystem
      try {
        // @ts-ignore
        const fileUri = `${FileSystem.documentDirectory}alline_game_data_${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(fileUri, dataStr);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          alert("Sharing not available");
        }
      } catch (e) {
        console.error("Error saving file:", e);
        alert("Error saving data");
      }
    }
  };


  const [walls, setWalls] = useState<Wall[]>([]);
  // Ref for walls to access in gameLoop closure without stale state
  const wallsRef = useRef<Wall[]>([]);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [cellSize, setCellSize] = useState(GRID_CELL_SIZE);
  const [floatingScores, setFloatingScores] = useState<{ id: number; amount: number }[]>([]);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // SESLER
  const [sounds, setSounds] = useState<any>({});

  // Ses Dosyaları Haritası
  // NOT: Kullanıcı bu dosyaları assets/sounds klasörüne eklemeli!
  const soundMap = useMemo(() => ({
    menu: require('../assets/sounds/menu.mp3'),
    slide: require('../assets/sounds/slide.mp3'),
    hit: require('../assets/sounds/hit.mp3'),
    score: require('../assets/sounds/score.mp3'),
    countdown: require('../assets/sounds/countdown.mp3'),
    bg_music: require('../assets/sounds/bg_music.mp3'),
  }), []);

  // Sesleri Yükle
  useEffect(() => {
    const loadSounds = async () => {
      const loadedSounds: any = {};

      try {
        // Efektler
        const { sound: menuSound } = await Audio.Sound.createAsync(soundMap.menu);
        loadedSounds.menu = menuSound;

        const { sound: slideSound } = await Audio.Sound.createAsync(soundMap.slide);
        loadedSounds.slide = slideSound;

        const { sound: hitSound } = await Audio.Sound.createAsync(soundMap.hit);
        loadedSounds.hit = hitSound;

        const { sound: scoreSound } = await Audio.Sound.createAsync(soundMap.score);
        loadedSounds.score = scoreSound;

        const { sound: countdownSound } = await Audio.Sound.createAsync(soundMap.countdown);
        loadedSounds.countdown = countdownSound;

        // Müzik (Loop)
        const { sound: musicSound } = await Audio.Sound.createAsync(soundMap.bg_music);
        await musicSound.setIsLoopingAsync(true);
        await musicSound.setVolumeAsync(0.5); // Hafif müzik
        // await musicSound.playAsync(); // Müzik kontrolü useEffect ile yapılacak
        loadedSounds.bg_music = musicSound;

        setSounds(loadedSounds);
      } catch (error) {
        // console.log("Ses yükleme hatası (Dosyalar eksik olabilir):", error);
      }
    };

    loadSounds();

    return () => {
      // Unload
      Object.values(sounds).forEach((sound: any) => {
        sound.unloadAsync();
      });
    };
  }, []);

  const playSound = useCallback(async (name: string) => {
    if (sounds[name]) {
      try {
        if (name === 'slide') {
          // Slide sesi: 75ms - 90ms arası (15ms süre)
          await sounds[name].playFromPositionAsync(75);
          setTimeout(() => {
            sounds[name].stopAsync();
          }, 15);
        } else {
          await sounds[name].setVolumeAsync(1.0);
          await sounds[name].replayAsync();
        }
      } catch (e) { }
    }
  }, [sounds]);

  const stopSound = useCallback(async (name: string) => {
    if (sounds[name]) {
      try {
        await sounds[name].stopAsync();
      } catch (e) { }
    }
  }, [sounds]);

  // Müzik Yönetimi
  useEffect(() => {
    const manageMusic = async () => {
      const music = sounds.bg_music;
      if (!music) return;

      // Müzik çalmalı mı? (Intro, Pause Menüsü veya Oyun Bittiğinde)
      // isPaused (kısa süreli duraklamalar) dahil edilmedi, sadece menü.
      const shouldPlay = !lang || showPauseMenu || gameOver;

      try {
        const status = await music.getStatusAsync();
        if (shouldPlay) {
          if (!status.isPlaying) {
            await music.playAsync();
          }
        } else {
          if (status.isPlaying) {
            await music.pauseAsync();
          }
        }
      } catch (e) {
        console.log("Müzik kontrol hatası:", e);
      }
    };

    manageMusic();
  }, [sounds.bg_music, lang, showPauseMenu, gameOver]);

  // Hareket Mantığı (Ref ile performans)
  const isProcessing = useRef(false);
  const activeDirection = useRef<{ dx: number; dy: number } | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTick = useRef(0);
  const lastMoveWasSuccessful = useRef(true); // Çarpma sesi kontrolü için
  const scoreScale = useRef(new Animated.Value(1)).current;

  // --- GAME LOOP (Akıcı Hareket) ---
  const gameLoop = useCallback(() => {
    if (!activeDirection.current || showPauseMenu) return;

    const now = Date.now();
    // 110ms'de bir hareket (Hız ayarı buradan yapılır - Daha smooth ve kontrollü)
    if (now - lastTick.current > 110) {
      performMove(activeDirection.current.dx, activeDirection.current.dy);
      lastTick.current = now;
    }
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameOver, isPaused]); // Removed walls/blocks from dependency to avoid loop recreation issues

  // Loop Başlat
  const startMoveLoop = (directionKey: keyof typeof DIRECTIONS) => {
    const dir = DIRECTIONS[directionKey];
    if (activeDirection.current === dir) return; // Prevent repeat if same direction

    playSound('menu');
    activeDirection.current = dir;
    lastMoveWasSuccessful.current = true; // Yeni harekette sesi sıfırla (ilk çarpma duyulsun)

    if (!animationFrameId.current) {
      performMove(dir.dx, dir.dy); // İlk hareket anında
      lastTick.current = Date.now();
      // DAS (Gecikme) - 150ms bekle sonra seriye bağla
      setTimeout(() => {
        if (activeDirection.current === dir && !animationFrameId.current) {
          animationFrameId.current = requestAnimationFrame(gameLoop);
        }
      }, 150);
    }
  };

  // Loop Durdur
  const stopMoveLoop = () => {
    activeDirection.current = null;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  };

  // --- KEYBOARD SUPPORT (WEB) ---
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (gameOver || isPaused || showPauseMenu) return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
        }

        switch (e.key) {
          case 'ArrowUp': startMoveLoop('UP'); break;
          case 'ArrowDown': startMoveLoop('DOWN'); break;
          case 'ArrowLeft': startMoveLoop('LEFT'); break;
          case 'ArrowRight': startMoveLoop('RIGHT'); break;
        }
      };
      const handleKeyUp = () => stopMoveLoop();

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [gameOver, isPaused, showPauseMenu]);


  // Check formation on blocks change
  useEffect(() => {
    if (blocks.length > 0) {
      checkFormation(blocks);
    }
  }, [blocks]);

  // --- HAREKET MANTIĞI ---
  const performMove = (dx: number, dy: number) => {
    if (gameOver || isPaused || isProcessing.current || showPauseMenu) return;

    setBlocks(prevBlocks => {
      let moved = false;
      const newBlocks = [...prevBlocks];

      // Sort based on direction to avoid collision issues
      const isReverse = (dx > 0 || dy > 0);
      const sortedIndices = newBlocks.map((_, i) => i).sort((a, b) => {
        const ba = newBlocks[a];
        const bb = newBlocks[b];
        if (dx !== 0) return isReverse ? bb.x - ba.x : ba.x - bb.x;
        return isReverse ? bb.y - ba.y : ba.y - bb.y;
      });

      const gridMap = new Map<string, boolean>();
      // Use wallsRef to ensure we have the latest walls even if closure is stale
      wallsRef.current.forEach(w => gridMap.set(`${w.y},${w.x}`, true));
      newBlocks.forEach(b => gridMap.set(`${b.y},${b.x}`, true));

      for (const i of sortedIndices) {
        const block = newBlocks[i];
        let cx = block.x;
        let cy = block.y;
        let nx = cx + dx;
        let ny = cy + dy;

        // Check boundary and collision
        if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS && !gridMap.has(`${ny},${nx}`)) {
          // Update Grid Map: remove old pos, add new pos
          gridMap.delete(`${cy},${cx}`);
          gridMap.set(`${ny},${nx}`, true);

          // Update Block
          newBlocks[i] = { ...block, x: nx, y: ny };
          moved = true;
        }
      }

      if (moved) {
        lastMoveWasSuccessful.current = true;
        setHasPlayed(true);

        // --- RL RECORDING ---
        // Record the move and the NEW state
        // Note: newBlocks is the state *after* the move. 
        // We use 'walls' from state (they don't change during move)
        let moveCode = '';
        if (dx === 0 && dy === -1) moveCode = 'T'; // Top (Up)
        else if (dx === 0 && dy === 1) moveCode = 'B'; // Bottom (Down)
        else if (dx === -1 && dy === 0) moveCode = 'L'; // Left
        else if (dx === 1 && dy === 0) moveCode = 'R'; // Right

        // Use wallsRef here too
        captureGridState(moveCode, wallsRef.current, newBlocks);
        // --------------------

        // Check formation after move (using setTimeout to allow render)
        // But for simplicity/correctness, we can check immediately or in useEffect
        // Let's check immediately with the new state
        // Note: checkFormation needs the latest blocks.
        // We can call it here with newBlocks
        // checkFormation(newBlocks); -> This might cause state update loop if not careful
        // Better to use useEffect on blocks change
      } else {
        // Hareket olmadı (Çarpma) - Hit sesi kaldırıldı
        lastMoveWasSuccessful.current = false;
      }
      return moved ? newBlocks : prevBlocks;
    });
  };

  const checkFormation = (currentBlocks: Block[]) => {
    if (!gameData || isPaused) return;
    // Grid Map oluştur
    const gridMap: (Block | null)[][] = Array(10).fill(null).map(() => Array(10).fill(null));
    currentBlocks.forEach(b => {
      if (b.y < 10 && b.x < 10) gridMap[b.y][b.x] = b;
    }); let foundInfo: { word: string; type: string; blocks: Block[] } | null = null;

    const checkSeq = (seq: Block[]) => {
      const word = seq.map(b => b.char).join('');
      if (foundWords.has(word)) return;
      if (gameData.targets.includes(word)) {
        foundInfo = { word, type: (word === gameData.source) ? 'GOLD' : 'TARGET', blocks: seq };
      } else if (gameData.all_valid && gameData.all_valid.includes(word)) {
        foundInfo = { word, type: 'BONUS', blocks: seq };
      }
    };

    const scan = (line: (Block | null)[]) => {
      let seq: Block[] = [];
      for (let item of line) {
        if (item) seq.push(item); else { if (seq.length >= 3) checkSeq(seq); seq = []; }
      }
      if (seq.length >= 3) checkSeq(seq);
    };

    for (let i = 0; i < 10; i++) scan(gridMap[i]);
    for (let x = 0; x < 10; x++) { let col: (Block | null)[] = []; for (let y = 0; y < 10; y++) col.push(gridMap[y][x]); scan(col); }

    if (foundInfo) handleFoundWord(foundInfo);
  };

  const handleFoundWord = ({ word, type, blocks: foundBlocks }: { word: string; type: string; blocks: Block[] }) => {
    // Puanlama ve Efekt
    let points = word.length * 10;
    if (type === 'BONUS') points = word.length * 5;
    if (type === 'GOLD') points = 500;

    let isEpic = false;
    // 7 Harfli Kelime Kuralı
    if (word.length === 7) {
      points = (7 * 50); // 350 Puan
      isEpic = true;
      type = 'EPIC'; // Override type for styling
    }

    setScore(prev => prev + points);
    setFoundWords(prev => { const newSet = new Set(prev); newSet.add(word); return newSet; });

    // Ses Efekti
    if (isEpic) {
      // 3-4 kez çal
      let count = 0;
      const playLoop = () => {
        if (count < 4) {
          playSound('score');
          count++;
          setTimeout(playLoop, 200);
        }
      };
      playLoop();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    } else {
      playSound('score');
    }

    // Floating Score Ekle
    const id = Date.now();
    setFloatingScores(prev => [...prev, { id, amount: points }]);

    // Score Heartbeat Animation
    scoreScale.setValue(1);
    Animated.sequence([
      Animated.timing(scoreScale, { toValue: 1.5, duration: 100, useNativeDriver: true }),
      Animated.timing(scoreScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    // Highlight
    // Highlight
    // Highlight
    setBlocks(prev => {
      // Use logicalBlocks.current to get the LATEST positions
      const currentState = prev;
      const next = currentState.map(b => {
        if (foundBlocks.some(fb => fb.id === b.id)) return { ...b, highlight: type };
        return { ...b, highlight: b.highlight }; // Preserve existing highlight
      });

      // Update logicalBlocks to match (sync)
      return next;
    });

    // --- RL RECORDING (ALIGNED OUTPUT) ---
    // Capture the state EXACTLY when alignment happens
    // We construct the state locally to ensure it's fresh and has the correct highlights for Replay
    const replayBlocks = blocks.map(b => {
      if (foundBlocks.some(fb => fb.id === b.id)) return { ...b, highlight: 'ALIGNED' }; // Force BLUE for Replay
      return b;
    });
    captureGridState('ALIGNED', wallsRef.current, replayBlocks, 'aligned-output');
    // -------------------------------------

    // Kısa bir duraklama
    setIsPaused(true);
    isProcessing.current = true; // Hareketi kilitle

    const pauseDuration = isEpic ? 2000 : 800; // 7 harfli ise 2 saniye bekle

    setTimeout(() => {
      setBlocks(prev => {
        const next = prev.map(b => ({ ...b, highlight: null }));
        return next;
      });
      setIsPaused(false);
      isProcessing.current = false;

      // Oyun Bitti mi?
      if (!gameData) return;
      const allTargetsFound = gameData.targets.every(t => foundWords.has(t) || t === word);
      if (type !== 'BONUS' && allTargetsFound) setGameOver(true);
    }, pauseDuration);
  };

  // --- BAŞLATMA ---
  const startGame = (selectedLang: string) => {
    // Müzik kontrolü: Oyun başlayınca müzik durmalı
    if (sounds.bg_music) {
      try {
        sounds.bg_music.pauseAsync();
      } catch (e) { }
    }

    setLang(selectedLang);
    setScore(0);
    setFoundWords(new Set());
    setFloatingScores([]);
    setHasPlayed(false);
    setTimeLeft(1200); // 20 dakika
    setGameOver(false);
    setIsPaused(false);
    setShowPauseMenu(false);

    // 1. Tarihe göre kelime seçimi
    const today = getTodayDate();
    // @ts-ignore
    const langData = GAME_DATA[selectedLang];

    if (!langData) return;

    // Bugünün verisini bul, yoksa en sonuncuyu al (Fallback)
    let dailyData = langData.find((d: any) => d.date === today);
    if (!dailyData) {
      dailyData = langData[langData.length - 1];
    }

    setGameData(dailyData);

    // 2. Seed Random (Tarih + Dil) -> Herkes için aynı grid
    const seed = `${dailyData.date}-${selectedLang}`;
    seedrandom(seed, { global: true });

    // 3. Grid Oluşturma (Deterministik)
    const { walls: newWalls, blocks: newBlocks } = generateGrid(dailyData.source);
    setWalls(newWalls);
    wallsRef.current = newWalls; // Sync Ref
    setBlocks(newBlocks);

    // --- RL RECORDING (INITIAL) ---
    gameHistoryRef.current = []; // Reset history ref
    // Capture initial state (need to wait for state update or pass directly)
    // Passing directly is safer here
    captureGridState('START', newWalls, newBlocks);
    // ------------------------------
  };

  const generateGrid = (sourceWord: string) => {
    let newWalls: Wall[] = [];
    const randomInt = (max: number) => Math.floor(Math.random() * max);
    const wallSet = new Set<string>();

    for (let i = 0; i < 6; i++) {
      let cx = randomInt(8) + 1; let cy = randomInt(8) + 1;
      let wallType = randomInt(7);
      let points = [{ x: 0, y: 0 }];
      if (Math.random() > 0.5) points.push({ x: 1, y: 0 });
      if (Math.random() > 0.5) points.push({ x: 0, y: 1 });
      points.forEach(p => {
        let wx = cx + p.x; let wy = cy + p.y;
        const key = `${wy},${wx}`;
        if (!wallSet.has(key)) {
          newWalls.push({ x: wx, y: wy, type: wallType });
          wallSet.add(key);
        }
      });
    }

    // Blokları oluştur
    const newBlocks: Block[] = [];
    let idCounter = 0;
    const placedPositions = new Set<string>();

    // 1. Kaynak kelimenin harflerini yerleştir
    const chars = sourceWord.split('');
    chars.forEach(char => {
      let placed = false;
      while (!placed) {
        const r = Math.floor(Math.random() * GRID_ROWS);
        const c = Math.floor(Math.random() * GRID_COLS);
        const key = `${r},${c}`;
        if (!placedPositions.has(key) && !wallSet.has(key)) {
          const block = { id: idCounter++, char, x: c, y: r, highlight: null };
          newBlocks.push(block);
          placedPositions.add(key);
          placed = true;
        }
      }
    });

    // Sort blocks by ID for consistent rendering order
    newBlocks.sort((a, b) => a.id - b.id);

    return { walls: newWalls, blocks: newBlocks };
  };

  // Zamanlayıcı
  useEffect(() => {
    if (!lang || isPaused || gameOver || showPauseMenu) return;
    const timer = setInterval(() => {
      if (!isPaused && !gameOver) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            stopSound('countdown'); // Countdown sesini durdur
            setGameOver(true);
            return 0;
          }
          // Geri sayım efekti (son 30 sn)
          if (prev <= 31) { // 30, 29... diye giderken
            playSound('countdown');
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lang, isPaused, gameOver, showPauseMenu, playSound]); // Added playSound to dependency array

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const gridContainerSize = cellSize > 0 ? (cellSize * GRID_COLS) + (GAP * (GRID_COLS - 1)) : 0;

  // --- GRID BOYUT HESAPLAMA ---
  const onGridAreaLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    const availableW = width - 20;
    const availableH = height - 10;

    const sizeW = Math.floor((availableW - (GAP * (GRID_COLS - 1))) / GRID_COLS);
    const sizeH = Math.floor((availableH - (GAP * (GRID_COLS - 1))) / GRID_COLS);

    const newSize = Math.min(sizeW, sizeH);
    setCellSize(newSize);
  };

  // --- OYUN BİTİŞ İŞLEMLERİ ---
  const handleReplay = () => {
    if (lang) startGame(lang);
    setShowPauseMenu(false);
  };

  const handleMainMenu = () => {
    setLang(null);
    setShowPauseMenu(false);
  };

  const handleExit = () => {
    if (NativeModules.ExitModule) {
      NativeModules.ExitModule.exitApp();
    } else {
      BackHandler.exitApp();
    }
  };

  const handlePause = () => {
    setShowPauseMenu(true);
  };

  const handleResume = () => {
    setShowPauseMenu(false);
  };

  // Back Handler
  useEffect(() => {
    const backAction = () => {
      if (lang) {
        if (showPauseMenu) {
          // Opsiyonel: Geri tuşu menüyü kapatabilir veya uygulamadan çıkabilir.
          // Kullanıcı isteği: "geri tuşuna basarsa yine bu tuşun fonksiyonu aktive olsun" -> Yani menüyü açsın.
          // Eğer menü zaten açıksa, belki kapatmak (Resume) mantıklı olabilir.
          setShowPauseMenu(false);
        } else {
          setShowPauseMenu(true);
        }
        return true; // Varsayılan davranışı engelle
      }
      return false; // Ana menüdeyse varsayılan davranış (Çıkış)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [lang, showPauseMenu]);

  const t = lang ? TEXTS[lang as keyof typeof TEXTS] : TEXTS['EN'];

  if (!lang) {
    return (
      <View style={styles.introContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <GradientText text="ALLINE" style={{ fontSize: 60, fontWeight: '900', letterSpacing: 8 }} width={300} height={100} />
        <View style={styles.langGrid}>
          {Object.keys(GAME_DATA).map(l => (
            <TouchableOpacity key={l} style={styles.langBtn} onPress={() => startGame(l)}>
              <Text style={styles.langText}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={{ marginTop: 30 }}
            onPress={() => router.push('/replay')}
          >
            <LinearGradient
              colors={[COLORS.grad1, COLORS.grad2]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }}>REPLAY VIEWER</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {showConfetti && <ConfettiExplosion />}

      {/* HEADER */}
      <View style={[styles.header, Platform.OS === 'web' && { justifyContent: 'center' }]}>
        <View style={[
          { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
          Platform.OS === 'web' && { maxWidth: 800, width: '100%' }
        ]}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <View style={{ alignItems: 'center' }}>
              <GradientText text="ALLINE" style={{ fontSize: 18, fontWeight: '900', letterSpacing: 1 }} width={80} height={24} align="center" />
              <TouchableOpacity onPress={handlePause} style={styles.pauseBtn}>
                <Text style={styles.pauseBtnText}>II</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: -1 }}>
            <View style={[styles.timerBox, timeLeft <= 30 && styles.timerUrgent, { paddingVertical: 4, paddingHorizontal: 12 }]}>
              <Text style={[styles.timerText, timeLeft <= 30 && styles.textUrgent, { fontSize: 16 }]}>{formatTime(timeLeft)}</Text>
            </View>
          </View>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: scoreScale }] }}>
              <Text style={[styles.scoreText, { fontSize: 24, lineHeight: 28 }]}>{score}</Text>
              <Text style={[styles.scoreLabel, { fontSize: 10 }]}>{t?.score || 'PTS'}</Text>
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Floating Scores Container */}
      <View style={[styles.floatingContainer, { pointerEvents: 'none' }]} >
        {floatingScores.map(s => (
          <FloatingScore
            key={s.id}
            amount={s.amount}
            onComplete={() => setFloatingScores(prev => prev.filter(i => i.id !== s.id))}
          />
        ))}
      </View>

      {/* TICKER (Grid Genişliğinde) - MOBILE ONLY */}
      {Platform.OS !== 'web' && (
        <View style={styles.tickerWrapper}>
          <LinearGradient
            colors={[COLORS.grad1, COLORS.grad2, COLORS.grad3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              padding: 2,
              width: gridContainerSize > 0 ? gridContainerSize : Dimensions.get('window').width - 40,
            }}
          >
            <View style={{
              backgroundColor: COLORS.bg,
              borderRadius: 14,
              overflow: 'hidden',
              height: 36,
              justifyContent: 'center'
            }}>
              {/* MOBILE TICKER */}
              {Platform.OS !== 'web' && gameData && (
                <Ticker
                  targets={gameData.targets}
                  foundWords={foundWords}
                  width={gridContainerSize > 0 ? gridContainerSize : Dimensions.get('window').width - 40}
                />
              )}
            </View>
          </LinearGradient>
        </View>
      )}

      {/* GRID ALANI + SIDEBAR (WEB) */}
      <View style={[styles.gridArea, Platform.OS === 'web' && { justifyContent: 'center', alignItems: 'center' }]} onLayout={onGridAreaLayout}>



        <View style={[styles.gridWrapper, { width: gridContainerSize + 6, height: gridContainerSize + 6 }]}>
          <LinearGradient
            colors={[COLORS.grad1, COLORS.grad2, COLORS.grad3]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.gridBorder}
          >
            <View style={[styles.gridContainer, { width: gridContainerSize, height: gridContainerSize }]}>
              {/* Grid Hücreleri */}
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
              {walls.map((w, i) => <Wall key={`w-${i}`} x={w.x} y={w.y} type={w.type} cellSize={cellSize} />)}
              {/* BLOKLAR */}
              {/* BLOKLAR */}
              {cellSize > 0 && blocks.map(block => (
                <Block
                  key={block.id}
                  char={block.char}
                  x={block.x}
                  y={block.y}
                  highlightType={block.highlight}
                  cellSize={cellSize}
                  id={block.id}
                />
              ))}
            </View>
          </LinearGradient>

          {/* WEB SIDEBAR (Absolute Positioned relative to Grid Wrapper) */}
          {Platform.OS === 'web' && gameData && (
            <View style={{ position: 'absolute', left: '100%', top: 0, bottom: 0, marginLeft: 20 }}>
              <Ticker
                targets={gameData.targets}
                foundWords={foundWords}
                width={200}
              />
            </View>
          )}
        </View>
      </View>

      {/* KONTROLLER - AYRIK VE ERGONOMİK */}
      <View style={styles.controlsArea}>
        <View style={styles.dpadContainer}>
          {/* YUKARI */}
          <View style={styles.dpadRow}>
            <ControlButton icon="▲" onPressIn={() => startMoveLoop('UP')} onPressOut={stopMoveLoop} />
          </View>

          {/* SOL - SAĞ (ORTA) */}
          <View style={styles.dpadRowMiddle}>
            <ControlButton icon="◀" onPressIn={() => startMoveLoop('LEFT')} onPressOut={stopMoveLoop} />
            <ControlButton icon="▶" onPressIn={() => startMoveLoop('RIGHT')} onPressOut={stopMoveLoop} />
          </View>

          {/* AŞAĞI */}
          <View style={styles.dpadRow}>
            <ControlButton icon="▼" onPressIn={() => startMoveLoop('DOWN')} onPressOut={stopMoveLoop} />
          </View>
        </View>
      </View>

      <Modal visible={gameOver || showPauseMenu} transparent animationType="fade">
        <View style={styles.overlay}>
          {showPauseMenu ? (
            <View style={{ marginBottom: 40 }}>
              <GradientText text="ALLINE" style={{ fontSize: 50, fontWeight: '900', letterSpacing: 6 }} width={250} height={80} align="center" />
            </View>
          ) : (
            <Text style={styles.overlayTitle}>{t?.gameOver}</Text>
          )}

          {!showPauseMenu && <Text style={styles.overlayScore}>{score} {t?.score}</Text>}

          <View style={styles.menuContainer}>
            {showPauseMenu ? (
              <TouchableOpacity
                style={[
                  styles.menuBtnSmall,
                  Platform.OS === 'web' && { width: 140, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.5)' }
                ]}
                onPress={() => { playSound('menu'); handleResume(); }}
              >
                <Text style={[styles.menuBtnTextSmall, Platform.OS === 'web' && { fontSize: 12 }]}>{t?.resume}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.menuBtn,
                  Platform.OS === 'web' && { width: 160, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.neonBlue, backgroundColor: 'rgba(0,0,0,0.6)' }
                ]}
                onPress={() => { playSound('menu'); handleReplay(); }}
              >
                <Text style={[styles.menuBtnText, Platform.OS === 'web' && { fontSize: 14 }]}>{t?.replay}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                showPauseMenu ? styles.menuBtnSmall : styles.menuBtn,
                Platform.OS === 'web' && { width: 140, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 5 }
              ]}
              onPress={() => { playSound('menu'); handleMainMenu(); }}
            >
              <Text style={[showPauseMenu ? styles.menuBtnTextSmall : styles.menuBtnText, Platform.OS === 'web' && { fontSize: 12 }]}>{t?.menu}</Text>
            </TouchableOpacity>

            {Platform.OS !== 'ios' && Platform.OS !== 'web' && (
              <>
                <TouchableOpacity style={[showPauseMenu ? styles.menuBtnSmall : styles.menuBtn, styles.menuBtnExit]} onPress={() => { playSound('menu'); handleExit(); }}>
                  <Text style={[showPauseMenu ? styles.menuBtnTextSmall : styles.menuBtnText, styles.menuBtnTextExit]}>{t?.exit}</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
              <ControlButton
                icon="↻"
                onPressIn={() => startGame(lang!)}
                onPressOut={() => { }}
                style={Platform.OS === 'web' ? { width: 40, height: 40, borderRadius: 10 } : {}}
              />
              <ControlButton
                icon="⬇️"
                onPressIn={hasPlayed ? downloadGameHistory : () => { }}
                onPressOut={() => { }}
                style={[
                  Platform.OS === 'web' ? { width: 40, height: 40, borderRadius: 10, marginLeft: 0 } : { marginLeft: 10 },
                  !hasPlayed && { opacity: 0.3 }
                ]}
              />
              <ControlButton
                icon="⌂"
                onPressIn={() => { setLang(null); setShowPauseMenu(false); }}
                onPressOut={() => { }}
                style={Platform.OS === 'web' ? { width: 40, height: 40, borderRadius: 10 } : {}}
              />
            </View>

            {/* AI Disclaimer */}
            {hasPlayed && (
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: COLORS.neonBlue, fontSize: 16, marginBottom: 5 }}>▲</Text>
                <Text style={{ color: '#ccc', fontSize: 12, textAlign: 'center', maxWidth: 280, fontWeight: 'bold', marginBottom: 5 }}>
                  {t?.aiDisclaimer}
                </Text>
                <Text style={{ color: '#aaa', fontSize: 11, textAlign: 'center', maxWidth: 280, fontStyle: 'italic' }}>
                  {t?.aiInstruction}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  introContainer: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 },
  langBtn: { width: 120, paddingVertical: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  langText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, width: '100%' },
  pauseBtn: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: 2 },
  pauseBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  headerStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerBox: { paddingVertical: 6, paddingHorizontal: 16, backgroundColor: '#222', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  timerUrgent: { borderColor: COLORS.neonRed, backgroundColor: 'rgba(255, 42, 109, 0.1)' },
  timerText: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  textUrgent: { color: COLORS.neonRed },

  scoreText: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '900',
    ...Platform.select({
      web: { textShadow: '0px 0px 10px rgba(255, 215, 0, 0.5)' },
      default: { textShadowColor: 'rgba(255, 215, 0, 0.5)', textShadowRadius: 10 }
    }),
    lineHeight: 32
  },
  scoreLabel: { color: '#888', fontSize: 12, fontWeight: 'bold', marginTop: -2 },

  floatingContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  floatingScore: {
    position: 'absolute',
    color: COLORS.accent,
    fontSize: 48,
    fontWeight: '900',
    ...Platform.select({
      web: { textShadow: '2px 2px 10px rgba(0,0,0,0.8)' },
      default: { textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 10, textShadowOffset: { width: 2, height: 2 } }
    })
  },

  tickerWrapper: { alignSelf: 'center', marginBottom: 8, marginTop: 2, zIndex: 20, justifyContent: 'center' },
  tickerContainer: { flex: 1, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  tickerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  tickerItem: { marginRight: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tickerItemFound: { backgroundColor: 'rgba(0, 255, 157, 0.2)', borderColor: COLORS.success, borderWidth: 1 },
  tickerText: { color: '#aaa', fontWeight: 'bold', fontSize: 14, marginRight: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  gridArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 10, zIndex: 1 },
  gridWrapper: { zIndex: 10 },
  gridBorder: { padding: 3, borderRadius: 14 },
  gridContainer: { backgroundColor: COLORS.grid, borderRadius: 10, position: 'relative', overflow: 'hidden' },
  cameraLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, opacity: 0.4 },
  camera: { flex: 1 },

  controlsArea: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingBottom: 5, flexShrink: 0 },
  dpadContainer: { alignItems: 'center', gap: 0 },
  dpadRow: { flexDirection: 'row', justifyContent: 'center' },
  dpadRowMiddle: { flexDirection: 'row', justifyContent: 'center', gap: 110, marginVertical: -5 },

  ctrlBtn: {
    width: 75, height: 75,
    borderRadius: 25,
    backgroundColor: '#2C2C2E',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    ...Platform.select({
      web: { boxShadow: '0px 0px 10px 0px ' + COLORS.neonBlue },
      web: { boxShadow: `0px 0px 10px ${COLORS.neonBlue}` },
      default: { shadowColor: COLORS.neonBlue, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 10 }
    })
  },
  ctrlBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 25 },
  ctrlBtnText: {
    color: '#FFF',
    fontSize: 38,
    fontWeight: '900',
    ...Platform.select({
      web: { textShadow: '0px 0px 10px ' + COLORS.neonBlue },
      default: { textShadowColor: COLORS.neonBlue, textShadowRadius: 10 }
    })
  },

  overlay: { flex: 1, backgroundColor: 'rgba(5,5,8,0.98)', justifyContent: 'center', alignItems: 'center' },
  overlayTitle: { fontSize: 42, color: '#fff', fontWeight: '900', marginBottom: 10, letterSpacing: 2 },
  overlayScore: { fontSize: 32, color: COLORS.accent, marginBottom: 50, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  menuContainer: { gap: 15, width: '70%', alignItems: 'center' },
  menuBtn: { paddingVertical: 15, width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  menuBtnText: { fontSize: 18, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },

  menuBtnSmall: { paddingVertical: 10, width: 180, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', ...Platform.select({ web: { boxShadow: '0px 0px 5px rgba(0,0,0,0.3)' }, default: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 } }) },
  menuBtnTextSmall: { fontSize: 14, fontWeight: '600', color: '#ddd', letterSpacing: 1.5, textTransform: 'uppercase' },

  menuBtnExit: { backgroundColor: 'rgba(255, 42, 109, 0.1)', borderColor: 'rgba(255, 42, 109, 0.3)' },
  menuBtnTextExit: { color: COLORS.neonRed }
});