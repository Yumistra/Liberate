// Discord/my-theme.json (DISTORTED HEAVENS, Bunny 테마 JSON) → Themes API 테마 플러그인 소스.
// my-theme.json 만 고치면 CI 가 이 스크립트로 플러그인을 다시 만든다.
//   사용법: node scripts/theme.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = '../Discord/my-theme.json'
const FONTS = '../Discord/my-ttf.json'
const OUT = 'plugins/distorted-heavens/src/index.ts'

const theme = JSON.parse(readFileSync(SRC, 'utf8'))
const fonts = JSON.parse(readFileSync(FONTS, 'utf8'))

const hex = v => (typeof v === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v) ? v : undefined)

// Bunny: [dark, light] (또는 문자열 하나)
const dark = {}
const light = {}
for (const [key, value] of Object.entries(theme.semanticColors ?? {})) {
    const [d, l] = Array.isArray(value) ? value : [value, value]
    if (hex(d)) dark[key] = d
    if (hex(l ?? d)) light[key] = l ?? d
}
const raw = {}
for (const [key, value] of Object.entries(theme.rawColors ?? {})) if (hex(value)) raw[key] = value

// 글꼴: my-ttf.json 의 가족 이름 → 플러그인 안의 fonts/<파일>
const WEIGHTS = [
    ['ExtraBold', 800],
    ['Semibold', 600],
    ['Bold', 700],
    ['Medium', 500],
    ['Normal', 400],
]
const families = {}
for (const [family, url] of Object.entries(fonts.main ?? {})) {
    const file = String(url).split('/').pop()
    const weight = WEIGHTS.find(([w]) => family.includes(w))?.[1] ?? 400
    families[family] = [{ path: `fonts/${file}`, weight, italic: /Italic/.test(family) }]
}

const bg = theme.background
const code = `// 자동 생성: node scripts/theme.mjs (Discord/my-theme.json 에서). 직접 고치지 말 것

const DARK: Record<string, string> = ${JSON.stringify(dark, null, 4)}

const LIGHT: Record<string, string> = ${JSON.stringify(light, null, 4)}

const RAW: Record<string, string> = ${JSON.stringify(raw, null, 4)}

const FAMILIES: Record<string, any> = ${JSON.stringify(families, null, 4)}

export default plugin({
    preInit({ themes }: any) {
        themes.registerGroup('distorted_heavens', {
            name: ${JSON.stringify(theme.name)},
            description: ${JSON.stringify(theme.description ?? '')},
        })
        themes.registerTheme('distorted_heavens', 'default', {
            name: ${JSON.stringify(theme.name)},
            getColors: () => ({
                semantic: { dark: DARK, darker: DARK, midnight: DARK, light: LIGHT },
                raw: RAW,
            }),${
                bg?.url
                    ? `
            // Bunny 의 배경: 그림을 ${bg.alpha ?? 1} 만큼 보이게 → 그 위의 화면을 ${1 - (bg.alpha ?? 1)} 만큼 덮는다
            background: { path: 'images/background${bg.url.match(/\.\w+$/)?.[0] ?? '.jpg'}', opacity: 1, blur: ${bg.blur ?? 0}, dimming: ${Math.round((1 - (bg.alpha ?? 1)) * 100) / 100} },`
                    : ''
            }
        })
        themes.registerFontPack('distorted_heavens', 'default', {
            name: ${JSON.stringify(fonts.name ?? theme.name)},
            families: FAMILIES,
        })
    },
})
`
writeFileSync(OUT, code)
console.log(`✓ ${OUT}: semantic ${Object.keys(dark).length}, raw ${Object.keys(raw).length}, fonts ${Object.keys(families).length}`)
