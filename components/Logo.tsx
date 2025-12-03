import { Platform } from 'react-native';
import Svg, { Defs, FeGaussianBlur, FeMerge, FeMergeNode, Filter, G, Path, Rect, Text as SvgText } from 'react-native-svg';

export default function Logo({ width = 200, height = 60 }: { width?: number; height?: number }) {
    // Content bounds: 
    // X: 0 (stroke -2.5) to 268 (stroke +2.5 -> 270.5).
    // Y: -44 (stroke -2.5 -> -46.5) to 168 (stroke +2.5 -> 170.5).
    // Width: ~274. Height: ~217.
    // ViewBox: -4 -50 290 230
    // Web'de filtreleri aktif ediyoruz.
    const filterUrl = Platform.OS === 'web' ? "url(#neon-glow-blue)" : undefined;

    return (
        <Svg width={width} height={height} viewBox="-4 -50 290 230">
            <Defs>
                <Filter id="neon-glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                    <FeGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <FeMerge>
                        <FeMergeNode in="coloredBlur" />
                        <FeMergeNode in="SourceGraphic" />
                    </FeMerge>
                </Filter>
            </Defs>

            {/* Ana Grafik: Tetris Blokları Şeklinde "A" Harfi İlüzyonu */}
            <G>
                {/* Sol Blok (Pembe/Taralı) -> TURKUAZ */}
                <Rect x="0" y="40" width="40" height="40" fill="none" stroke="#00fff2" strokeWidth="5" {...(filterUrl ? { filter: filterUrl } : {})} />
                <Path d="M 5 75 L 35 45 M 15 75 L 35 55 M 0 60 L 20 40" stroke="#00fff2" strokeWidth="3" opacity="0.8" />

                <Rect x="44" y="40" width="40" height="40" fill="none" stroke="#00fff2" strokeWidth="5" {...(filterUrl ? { filter: filterUrl } : {})} />
                <Path d="M 49 75 L 79 45 M 59 75 L 79 55 M 44 60 L 64 40" stroke="#00fff2" strokeWidth="3" opacity="0.8" />

                {/* Orta Dikey Blok (Parlak Mavi) -> TURUNCU - YUKARI TAŞINDI (-44) */}
                <G transform="translate(88, -48)" {...(filterUrl ? { filter: filterUrl } : {})}>
                    {/* A */}
                    <Rect x="0" y="0" width="40" height="40" rx="4" fill="none" stroke="#FF5E00" strokeWidth="5" />
                    <SvgText x="20" y="30" fontFamily="Arial" fontWeight="900" fontSize="28" fill="#FF5E00" textAnchor="middle">A</SvgText>

                    {/* L */}
                    <Rect x="0" y="44" width="40" height="40" rx="4" fill="none" stroke="#FF5E00" strokeWidth="5" />
                    <SvgText x="20" y="74" fontFamily="Arial" fontWeight="900" fontSize="28" fill="#FF5E00" textAnchor="middle">L</SvgText>

                    {/* L */}
                    <Rect x="0" y="88" width="40" height="40" rx="4" fill="none" stroke="#FF5E00" strokeWidth="5" />
                    <SvgText x="20" y="118" fontFamily="Arial" fontWeight="900" fontSize="28" fill="#FF5E00" textAnchor="middle">L</SvgText>
                </G>

                {/* Sağ Yan Yazı: "INE" (Parlak Turuncu) - Kareler (Filtresiz, Net Çizgiler) */}
                <G transform="translate(132, 40)" {...(filterUrl ? { filter: filterUrl } : {})}>
                    <Rect x="0" y="0" width="40" height="40" rx="4" fill="none" stroke="#FF5E00" strokeWidth="5" />
                    <SvgText x="20" y="30" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#FF5E00" textAnchor="middle">I</SvgText>

                    <Rect x="44" y="0" width="40" height="40" rx="4" fill="none" stroke="#FF5E00" strokeWidth="5" />
                    <SvgText x="64" y="30" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#FF5E00" textAnchor="middle">N</SvgText>

                    <Rect x="88" y="0" width="40" height="40" rx="4" fill="none" stroke="#FF5E00" strokeWidth="5" />
                    <SvgText x="108" y="30" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#FF5E00" textAnchor="middle">E</SvgText>
                </G>
            </G>
        </Svg>
    );
}
