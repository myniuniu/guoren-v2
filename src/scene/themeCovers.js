function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

function buildCoverSvg({ start, end, body }) {
  return svgToDataUrl(`
    <svg width="800" height="450" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="800" y2="450" gradientUnits="userSpaceOnUse">
          <stop stop-color="${start}" />
          <stop offset="1" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" rx="28" fill="url(#bg)" />
      ${body}
    </svg>
  `);
}

export const SCENE_THEME_COVER_PRESETS = [
  {
    id: 'artist_joy',
    category: '艺术家作品',
    name: '节庆欢腾',
    coverStart: '#ff7a18',
    coverEnd: '#ff477e',
    image: buildCoverSvg({
      start: '#ff7a18',
      end: '#ff477e',
      body: `
        <rect x="0" y="0" width="800" height="450" fill="rgba(255,255,255,0.05)" />
        <circle cx="118" cy="96" r="26" fill="#ffd166" />
        <circle cx="664" cy="82" r="18" fill="#ffd166" />
        <circle cx="720" cy="138" r="10" fill="#fff1cf" />
        <path d="M178 287C216 235 282 195 353 195C424 195 467 230 510 269C554 308 609 336 670 336C706 336 736 329 761 318V394H178V287Z" fill="rgba(255,255,255,0.12)" />
        <path d="M160 120C212 120 244 202 294 202C343 202 364 140 404 140C444 140 470 222 522 222C574 222 610 148 674 148" stroke="rgba(255,255,255,0.2)" stroke-width="10" stroke-linecap="round" />
        <text x="116" y="286" fill="#ffe178" font-size="158" font-family="Verdana" font-weight="700">JOY</text>
        <text x="112" y="286" fill="#4dd4ac" font-size="158" font-family="Verdana" font-weight="700">JOY</text>
      `,
    }),
  },
  {
    id: 'artist_festival',
    category: '艺术家作品',
    name: '节日纹样',
    coverStart: '#ff3b30',
    coverEnd: '#f94144',
    image: buildCoverSvg({
      start: '#ff3b30',
      end: '#f94144',
      body: `
        <rect x="18" y="18" width="764" height="414" rx="22" stroke="rgba(255,255,255,0.72)" stroke-width="4" />
        <circle cx="400" cy="225" r="120" fill="rgba(255,220,179,0.14)" />
        <path d="M310 244C342 169 449 145 492 210C518 249 486 302 430 308C373 314 327 292 310 244Z" fill="rgba(255,230,170,0.92)" />
        <path d="M272 178L532 178M262 274L548 274M232 124L574 124M232 326L574 326" stroke="rgba(255,255,255,0.16)" stroke-width="6" stroke-linecap="round" />
        <path d="M184 94L616 356M184 356L616 94" stroke="rgba(255,255,255,0.12)" stroke-width="4" stroke-linecap="round" />
        <text x="78" y="112" fill="#ffe7a4" font-size="52" font-family="KaiTi" font-weight="700">瑞</text>
        <text x="650" y="112" fill="#ffe7a4" font-size="52" font-family="KaiTi" font-weight="700">祥</text>
        <text x="88" y="356" fill="#ffe7a4" font-size="52" font-family="KaiTi" font-weight="700">纳</text>
        <text x="650" y="356" fill="#ffe7a4" font-size="52" font-family="KaiTi" font-weight="700">福</text>
      `,
    }),
  },
  {
    id: 'abstract_blue_wave',
    category: '抽象',
    name: '深海流线',
    coverStart: '#0f4cdb',
    coverEnd: '#7fd0ff',
    image: buildCoverSvg({
      start: '#edf6ff',
      end: '#dceeff',
      body: `
        <path d="M-40 360C88 216 204 124 338 116C468 109 574 176 692 171C748 169 800 155 840 138V450H-40V360Z" fill="#1d6cff" />
        <path d="M-70 312C72 188 186 130 300 138C410 146 516 220 632 219C718 218 782 184 860 138V450H-70V312Z" fill="#0d46c7" fill-opacity="0.88" />
        <path d="M40 84C162 128 278 152 378 144C478 136 568 92 704 42" stroke="#c5e8ff" stroke-width="16" stroke-linecap="round" opacity="0.66" />
      `,
    }),
  },
  {
    id: 'abstract_sunset_flow',
    category: '抽象',
    name: '霓虹渐变',
    coverStart: '#295bff',
    coverEnd: '#ff6d6d',
    image: buildCoverSvg({
      start: '#1746ff',
      end: '#ff7c87',
      body: `
        <defs>
          <radialGradient id="sun" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(526 216) rotate(90) scale(200 286)">
            <stop stop-color="#ffd16f" />
            <stop offset="0.52" stop-color="#ff6cb5" />
            <stop offset="1" stop-color="#1f55ff" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="800" height="450" fill="url(#sun)" fill-opacity="0.88" />
        <path d="M-12 322C152 254 270 244 394 246C518 248 652 264 812 230V450H-12V322Z" fill="rgba(255,255,255,0.14)" />
      `,
    }),
  },
  {
    id: 'abstract_prism',
    category: '抽象',
    name: '棱镜方块',
    coverStart: '#b34cff',
    coverEnd: '#ff9b7a',
    image: buildCoverSvg({
      start: '#fbd0ef',
      end: '#fff0da',
      body: `
        <rect x="96" y="112" width="162" height="162" rx="22" fill="#8e52ff" fill-opacity="0.82" />
        <rect x="210" y="74" width="196" height="196" rx="28" fill="#ff8bd0" fill-opacity="0.78" />
        <rect x="380" y="112" width="162" height="162" rx="22" fill="#ffa55f" fill-opacity="0.84" />
        <rect x="536" y="74" width="164" height="164" rx="22" fill="#ff6257" fill-opacity="0.9" />
        <path d="M96 112L210 74V270L96 274V112Z" fill="rgba(255,255,255,0.26)" />
        <path d="M210 74L406 74L542 112L380 112L210 74Z" fill="rgba(255,255,255,0.3)" />
      `,
    }),
  },
  {
    id: 'abstract_glass',
    category: '抽象',
    name: '玻璃圆体',
    coverStart: '#0047ff',
    coverEnd: '#c7d9ff',
    image: buildCoverSvg({
      start: '#f8d9ec',
      end: '#ecf2ff',
      body: `
        <circle cx="302" cy="240" r="118" fill="#52b9ff" fill-opacity="0.3" stroke="rgba(255,255,255,0.52)" stroke-width="18" />
        <circle cx="534" cy="178" r="144" fill="#ffffff" fill-opacity="0.38" stroke="rgba(255,255,255,0.8)" stroke-width="18" />
        <rect x="112" y="144" width="108" height="108" rx="18" fill="#a7d4ff" fill-opacity="0.52" />
        <rect x="180" y="206" width="138" height="138" rx="24" fill="#85a7ff" fill-opacity="0.34" />
      `,
    }),
  },
  {
    id: 'abstract_silk',
    category: '抽象',
    name: '珠光丝绸',
    coverStart: '#f3d7ff',
    coverEnd: '#fff0e0',
    image: buildCoverSvg({
      start: '#f7f4f6',
      end: '#ffe8db',
      body: `
        <path d="M60 336C164 234 298 110 430 74C514 51 606 71 740 128V450H60V336Z" fill="rgba(223,180,255,0.34)" />
        <path d="M40 300C178 218 292 176 378 188C492 205 586 295 770 366" stroke="rgba(255,255,255,0.9)" stroke-width="34" stroke-linecap="round" opacity="0.56" />
        <path d="M90 260C220 168 316 136 426 160C516 180 602 258 742 314" stroke="rgba(255,255,255,0.8)" stroke-width="20" stroke-linecap="round" opacity="0.42" />
      `,
    }),
  },
  {
    id: 'abstract_gold',
    category: '抽象',
    name: '暖光曲面',
    coverStart: '#ffcb52',
    coverEnd: '#fff4af',
    image: buildCoverSvg({
      start: '#fffdf4',
      end: '#fff3c9',
      body: `
        <path d="M-14 412C120 278 244 188 360 152C460 121 596 126 814 232V450H-14V412Z" fill="#ffd454" fill-opacity="0.9" />
        <path d="M58 362C210 244 356 196 506 212C606 222 694 262 802 336" stroke="rgba(255,255,255,0.6)" stroke-width="18" stroke-linecap="round" />
      `,
    }),
  },
  {
    id: 'abstract_portal',
    category: '抽象',
    name: '光域镜面',
    coverStart: '#4d8eff',
    coverEnd: '#9fe1ff',
    image: buildCoverSvg({
      start: '#86bfff',
      end: '#e6f6ff',
      body: `
        <path d="M0 284C164 242 286 216 400 216C514 216 636 242 800 284V450H0V284Z" fill="#4b9cff" fill-opacity="0.4" />
        <rect x="332" y="118" width="136" height="214" fill="rgba(255,255,255,0.3)" />
        <path d="M400 80L512 118L512 332L400 370L288 332L288 118L400 80Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.85)" stroke-width="10" />
        <path d="M230 354C284 298 336 246 400 246C464 246 516 298 570 354" stroke="rgba(255,255,255,0.34)" stroke-width="12" stroke-linecap="round" />
      `,
    }),
  },
  {
    id: 'abstract_speed',
    category: '抽象',
    name: '极速轨迹',
    coverStart: '#061c8d',
    coverEnd: '#5cc7ff',
    image: buildCoverSvg({
      start: '#05133f',
      end: '#123fb6',
      body: `
        <path d="M0 278L800 170" stroke="rgba(88,205,255,0.36)" stroke-width="6" />
        <path d="M0 314L800 198" stroke="rgba(88,205,255,0.48)" stroke-width="8" />
        <path d="M0 350L800 228" stroke="rgba(255,255,255,0.18)" stroke-width="4" />
        <circle cx="610" cy="152" r="84" fill="rgba(120,222,255,0.22)" />
        <circle cx="610" cy="152" r="24" fill="rgba(255,255,255,0.94)" />
      `,
    }),
  },
  {
    id: 'abstract_mist',
    category: '抽象',
    name: '雾光渐层',
    coverStart: '#8ea6ff',
    coverEnd: '#f3ddb1',
    image: buildCoverSvg({
      start: '#dbe7ff',
      end: '#fff1d6',
      body: `
        <defs>
          <radialGradient id="mist1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(298 246) rotate(90) scale(200 260)">
            <stop stop-color="#8eb2ff" />
            <stop offset="1" stop-color="#8eb2ff" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="mist2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(570 168) rotate(90) scale(180 220)">
            <stop stop-color="#fff5dc" />
            <stop offset="1" stop-color="#fff5dc" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#mist1)" />
        <rect width="800" height="450" fill="url(#mist2)" />
      `,
    }),
  },
  {
    id: 'abstract_mint',
    category: '抽象',
    name: '薄荷山丘',
    coverStart: '#5ed3a6',
    coverEnd: '#f5f6d2',
    image: buildCoverSvg({
      start: '#f7fff9',
      end: '#fff7d8',
      body: `
        <path d="M0 332C86 252 160 232 224 266C284 296 340 356 404 356C468 356 502 310 560 310C616 310 646 354 800 302V450H0V332Z" fill="#6ce2b2" fill-opacity="0.8" />
        <path d="M0 378C108 324 192 318 280 340C346 356 406 388 464 388C546 388 598 342 800 354V450H0V378Z" fill="#38b487" fill-opacity="0.92" />
      `,
    }),
  },
];

const coverPresetMap = new Map(SCENE_THEME_COVER_PRESETS.map((preset) => [preset.id, preset]));

const DEFAULT_PRESET_BY_SCENE_TYPE = Object.freeze({
  TEACHING: 'abstract_blue_wave',
  RESEARCH: 'abstract_portal',
  TRAINING: 'abstract_gold',
  COMMUNITY: 'abstract_mint',
  CUSTOM: 'abstract_mist',
});

export function getSceneThemeCoverPreset(id) {
  return coverPresetMap.get(id) || null;
}

export function getDefaultSceneThemeCoverPresetId(sceneType = 'CUSTOM') {
  return DEFAULT_PRESET_BY_SCENE_TYPE[sceneType] || DEFAULT_PRESET_BY_SCENE_TYPE.CUSTOM;
}

export function getSceneThemeCoverPalette(theme = {}) {
  const preset = getSceneThemeCoverPreset(theme?.coverPresetId);
  return {
    coverStart: theme?.coverStart || preset?.coverStart || '#4f8cff',
    coverEnd: theme?.coverEnd || preset?.coverEnd || '#7ee4ff',
  };
}

export function getSceneThemeCoverImage(theme = {}) {
  if (theme?.coverSource === 'UPLOAD' && theme?.coverImage) {
    return theme.coverImage;
  }
  return getSceneThemeCoverPreset(theme?.coverPresetId)?.image || null;
}

export function getSceneThemeCoverStyle(theme = {}, options = {}) {
  const { coverStart, coverEnd } = getSceneThemeCoverPalette(theme);
  const coverImage = getSceneThemeCoverImage(theme);
  const overlayStart = options.overlayStart || 'rgba(15, 23, 42, 0.30)';
  const overlayEnd = options.overlayEnd || 'rgba(15, 23, 42, 0.08)';

  if (coverImage) {
    return {
      backgroundImage: `linear-gradient(135deg, ${overlayStart} 0%, ${overlayEnd} 100%), url("${coverImage}")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
    };
  }

  return {
    background: `linear-gradient(135deg, ${coverStart} 0%, ${coverEnd} 100%)`,
  };
}
