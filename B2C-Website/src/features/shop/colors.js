// Preserve the shades already used by the catalog.
const swatches = {
  beige: '#b8ac94',
  brown: '#604536',
  black: '#232323',
  white: '#fff',
  navy: '#173345',
  blue: '#6387aa',
  green: '#28564b',
  olive: '#394d3d',
  ivory: '#eee8dc',
  pink: '#d03f79',
  red: '#a83232',
  grey: '#929292',
  gray: '#929292',
  gold: '#d4af37',
}
// Standard CSS names are allowed in both server and browser renders; CSS supplies their shades.
const namedColors = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
  blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk
  crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
  darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
  darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
  dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
  gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
  lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
  lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen
  magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
  mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream
  mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
  palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
  powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
  seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
  steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(
    /\s+/,
  ),
)
const arabic = {
  بيج: 'beige',
  بني: 'brown',
  اسود: 'black',
  ابيض: 'white',
  كحلي: 'navy',
  ازرق: 'blue',
  اخضر: 'green',
  زيتي: 'olive',
  عاجي: 'ivory',
  وردي: 'pink',
  احمر: 'red',
  رمادي: 'grey',
  ذهبي: 'gold',
  دهبي: 'gold',
  فضي: 'silver',
  اصفر: 'yellow',
  برتقالي: 'orange',
  بنفسجي: 'purple',
  سماوي: 'skyblue',
  تركواز: 'turquoise',
  'ازرق فاتح': 'lightblue',
  'ازرق داكن': 'darkblue',
  'احمر داكن': 'darkred',
}
const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)ال/g, '$1')
function namedSwatch(value) {
  const key = (Object.hasOwn(arabic, value) ? arabic[value] : value).replace(/[\s_-]/g, '')
  return Object.hasOwn(swatches, key) ? swatches[key] : namedColors.has(key) ? key : null
}
export function colorSwatch(value) {
  // shortcut: custom shade names need a palette alias until the API supplies explicit swatches.
  return namedSwatch(normalize(value.name)) || namedSwatch(normalize(value.key)) || '#d1d4d3'
}
