export const INDUSTRY_IMAGES = [
  {
    key: 'tech',
    test: /tech|fintech|digital|\bai\b|software|innovation|startup|app|platform/i,
    image: '/industry/tech.jpg',
  },
  {
    key: 'agri',
    test: /agri|farm|farmer|agriculture|food/i,
    image: '/industry/agri.jpg',
  },
  {
    key: 'women',
    test: /\b(woman|women|female|she)\b/i,
    image: '/industry/women.jpg',
  },
  {
    key: 'creative',
    test: /creative|music|film|media|artist|story/i,
    image: '/industry/creative.jpg',
  },
]

export const INDUSTRY_DEFAULT = '/industry/small.jpg'

export function industryImageFor(type = '') {
  const match = INDUSTRY_IMAGES.find((i) => i.test.test(type))
  return match ? match.image : INDUSTRY_DEFAULT
}