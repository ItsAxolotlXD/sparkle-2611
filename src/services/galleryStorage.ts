// IndexedDB storage service for Sparkle Gallery and Draws integration

export interface GalleryMediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string; // Blob URL or external URL or data URL
  blobData?: Blob; // Stored binary blob
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number; // bytes
  dateAdded: string; // ISO date string
  dateLabel?: string; // e.g. "October 14, 2022" or "October 2022"
  year?: number; // e.g. 2022
  dimensions?: { width: number; height: number };
  aspectRatio: number; // width / height, e.g. 1.77 for 16:9, 0.75 for 3:4
  duration?: number; // seconds for audio/video
  isFavorite?: boolean;
  tags?: string[];
  description?: string;
  source?: 'upload' | 'draws' | 'default';
  folderId?: string | null;
}

export interface GalleryFolder {
  id: string;
  name: string;
  dateCreated: string;
}

const DB_NAME = 'VOne_Gallery_DB';
const DB_VERSION = 2;
const STORE_NAME = 'media_items';
const FOLDER_STORE_NAME = 'folders';

// High-fidelity initial seed media matching the reference image layout
export const DEFAULT_GALLERY_ITEMS: GalleryMediaItem[] = [
  // 1. Vietnam Iconic Landscapes & Heritage
  {
    id: 'seed-halong-bay-dawn',
    title: 'Ha Long Bay limestone peaks at dawn',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3450000,
    dateAdded: '2026-02-14T07:15:00Z',
    dateLabel: 'February 14, 2026',
    year: 2026,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Vietnam', 'Landscape', 'Ha Long', 'UNESCO', 'Sea'],
    description: 'Emerald waters surrounded by mystical limestone karsts emerging through early morning fog in Ha Long Bay.',
    source: 'default',
  },
  {
    id: 'seed-hoian-lantern-night',
    title: 'Hoi An glowing lanterns by the canal',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2980000,
    dateAdded: '2026-02-10T19:40:00Z',
    dateLabel: 'February 10, 2026',
    year: 2026,
    dimensions: { width: 1600, height: 1200 },
    aspectRatio: 4 / 3,
    isFavorite: true,
    tags: ['Vietnam', 'Hoi An', 'Lanterns', 'Night', 'Culture'],
    description: 'Vibrant silk lanterns illuminating wooden boats and historic riverside merchant shops in Hoi An ancient town.',
    source: 'default',
  },
  {
    id: 'seed-sapa-misty-terraces',
    title: 'Sapa emerald mountain rice terraces',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3200000,
    dateAdded: '2025-11-20T08:00:00Z',
    dateLabel: 'November 20, 2025',
    year: 2025,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Vietnam', 'Sapa', 'Terraces', 'Mountains', 'Green'],
    description: 'Grand cascading rice terrace steps carved along northern mountain ridges draped in rolling cloud layers.',
    source: 'default',
  },
  {
    id: 'seed-bangioc-waterfall',
    title: 'Ban Gioc cascading multi-tier waterfall',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2840000,
    dateAdded: '2025-10-18T11:30:00Z',
    dateLabel: 'October 18, 2025',
    year: 2025,
    dimensions: { width: 1200, height: 1600 },
    aspectRatio: 3 / 4,
    isFavorite: false,
    tags: ['Vietnam', 'Cao Bang', 'Waterfall', 'Nature'],
    description: 'Majestic thunderous waters cascading across tiered limestone cliffs surrounded by tropical foliage.',
    source: 'default',
  },
  {
    id: 'seed-danang-dragon-bridge',
    title: 'Dragon Bridge fiery nocturnal illumination',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2650000,
    dateAdded: '2025-08-15T21:00:00Z',
    dateLabel: 'August 15, 2025',
    year: 2025,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Vietnam', 'Da Nang', 'Architecture', 'City', 'Night'],
    description: 'Golden dragon structure arching across the Han river with colorful reflections in the evening water.',
    source: 'default',
  },
  {
    id: 'seed-dalat-pine-mist',
    title: 'Dalat pine valley sunrise rays',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3120000,
    dateAdded: '2025-06-05T06:20:00Z',
    dateLabel: 'June 5, 2025',
    year: 2025,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: false,
    tags: ['Vietnam', 'Dalat', 'Forest', 'Sunrise', 'Mist'],
    description: 'Spectacular sunbeams piercing dense coniferous trees in the cool mountain highlands of Dalat.',
    source: 'default',
  },

  // 2. Global Landscapes & Wonders
  {
    id: 'seed-plane-sunset-2022',
    title: 'Flight over pink pastel clouds',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2450000,
    dateAdded: '2024-10-12T08:30:00Z',
    dateLabel: 'October 12, 2024',
    year: 2024,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Travel', 'Aviation', 'Sunset', 'Clouds'],
    description: 'Looking out the window over pastel sunset clouds while cruising at 35,000 feet.',
    source: 'default',
  },
  {
    id: 'seed-fuji-cherry-blossom',
    title: 'Mount Fuji reflection with spring sakura',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3340000,
    dateAdded: '2024-04-18T09:10:00Z',
    dateLabel: 'April 18, 2024',
    year: 2024,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Japan', 'Fuji', 'Sakura', 'Spring', 'Mountains'],
    description: 'Iconic snow-capped volcanic cone framed by delicate pink cherry blossom branches over Lake Kawaguchiko.',
    source: 'default',
  },
  {
    id: 'seed-aurora-borealis-norway',
    title: 'Emerald aurora borealis over Arctic fjord',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3750000,
    dateAdded: '2024-01-22T23:15:00Z',
    dateLabel: 'January 22, 2024',
    year: 2024,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Aurora', 'Night', 'Norway', 'Arctic', 'Sky'],
    description: 'Dancing green solar ribbons sweeping across the star-studded Arctic night sky above still fjord waters.',
    source: 'default',
  },
  {
    id: 'seed-swiss-alps-meadow',
    title: 'Swiss alpine peaks and wildflower valley',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3890000,
    dateAdded: '2023-07-14T14:40:00Z',
    dateLabel: 'July 14, 2023',
    year: 2023,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Alps', 'Mountains', 'Switzerland', 'Wildflowers'],
    description: 'Jagged glacier-capped peaks towering above a lush green valley carpeted in yellow summer alpine blooms.',
    source: 'default',
  },
  {
    id: 'seed-sand-dune-shadow-2022',
    title: 'Desert dune knife-edge ridge at dusk',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2120000,
    dateAdded: '2023-05-15T16:20:00Z',
    dateLabel: 'May 15, 2023',
    year: 2023,
    dimensions: { width: 900, height: 1600 },
    aspectRatio: 9 / 16,
    isFavorite: false,
    tags: ['Landscape', 'Desert', 'Minimal', 'Shadow'],
    description: 'Crisp shadow cast across the golden sand dunes under an expansive deep azure sky.',
    source: 'default',
  },
  {
    id: 'seed-waterfront-mountain-2022',
    title: 'Harbor pavilion and twilight mountain clouds',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2890000,
    dateAdded: '2023-03-16T19:00:00Z',
    dateLabel: 'March 16, 2023',
    year: 2023,
    dimensions: { width: 1600, height: 1000 },
    aspectRatio: 1.6,
    isFavorite: true,
    tags: ['Harbor', 'Mountains', 'Twilight'],
    description: 'Evening blue hour lighting up the coastal waterfront beneath dramatic clouds.',
    source: 'default',
  },
  {
    id: 'seed-maldives-sandbar',
    title: 'Aerial turquoise atoll & white sandbank',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3100000,
    dateAdded: '2022-12-08T11:00:00Z',
    dateLabel: 'December 8, 2022',
    year: 2022,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: false,
    tags: ['Maldives', 'Aerial', 'Ocean', 'Beach', 'Tropical'],
    description: 'Pristine turquoise reef gradients surrounding a solitary white sandbar in the Indian Ocean.',
    source: 'default',
  },
  {
    id: 'seed-kyoto-bamboo-grove',
    title: 'Arashiyama bamboo grove sunbeams',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=1200&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2450000,
    dateAdded: '2022-11-19T08:45:00Z',
    dateLabel: 'November 19, 2022',
    year: 2022,
    dimensions: { width: 900, height: 1600 },
    aspectRatio: 9 / 16,
    isFavorite: false,
    tags: ['Kyoto', 'Bamboo', 'Zen', 'Nature', 'Japan'],
    description: 'Towering green bamboo stalks swaying gently as early morning sunbeams stream through the canopy.',
    source: 'default',
  },

  // 3. Modern Architecture & Urban Photography
  {
    id: 'seed-city-sunset-street-2022',
    title: 'Downtown golden hour city lights',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3100000,
    dateAdded: '2022-10-13T17:45:00Z',
    dateLabel: 'October 13, 2022',
    year: 2022,
    dimensions: { width: 1600, height: 1000 },
    aspectRatio: 1.6,
    isFavorite: false,
    tags: ['City', 'Architecture', 'Sunset', 'Street'],
    description: 'Vibrant golden hour glow over the urban street boulevard and autumn trees.',
    source: 'default',
  },
  {
    id: 'seed-shinjuku-neon-rain',
    title: 'Cyberpunk rainy Tokyo neon boulevard',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2750000,
    dateAdded: '2022-10-14T21:10:00Z',
    dateLabel: 'October 14, 2022',
    year: 2022,
    dimensions: { width: 900, height: 1600 },
    aspectRatio: 9 / 16,
    isFavorite: true,
    tags: ['Tokyo', 'Neon', 'Rain', 'Cyberpunk', 'City'],
    description: 'Wet asphalt reflecting glowing neon signs and umbrella silhouettes in vibrant Shinjuku alleys.',
    source: 'default',
  },
  {
    id: 'seed-golden-gate-fog',
    title: 'Golden Gate Bridge rising above sea fog',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3200000,
    dateAdded: '2022-10-15T09:30:00Z',
    dateLabel: 'October 15, 2022',
    year: 2022,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: false,
    tags: ['Bridge', 'San Francisco', 'Fog', 'Architecture'],
    description: 'International orange towers piercing dense marine fog rolling across the San Francisco strait.',
    source: 'default',
  },
  {
    id: 'seed-marinabay-singapore',
    title: 'Marina Bay Sands futuristic skyline',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2900000,
    dateAdded: '2022-10-16T18:20:00Z',
    dateLabel: 'October 16, 2022',
    year: 2022,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Singapore', 'Architecture', 'Modern', 'City'],
    description: 'Iconic cantilever skybridge and glass towers reflecting off the glassy Marina Bay waters.',
    source: 'default',
  },
  {
    id: 'seed-spiral-concrete-architecture',
    title: 'Spiral minimalist museum staircase',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2150000,
    dateAdded: '2022-10-17T14:00:00Z',
    dateLabel: 'October 17, 2022',
    year: 2022,
    dimensions: { width: 900, height: 1600 },
    aspectRatio: 9 / 16,
    isFavorite: false,
    tags: ['Architecture', 'Minimal', 'Geometric', 'Design'],
    description: 'Monolithic raw concrete curves forming a mesmerizing geometric spiral staircase illuminated by top skylight.',
    source: 'default',
  },

  // 4. Wildlife & Pets
  {
    id: 'seed-fluffy-puppy-2022',
    title: 'Curious caramel maltipoo puppy',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1200&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 1750000,
    dateAdded: '2022-10-10T11:15:00Z',
    dateLabel: 'October 10, 2022',
    year: 2022,
    dimensions: { width: 1000, height: 1250 },
    aspectRatio: 4 / 5,
    isFavorite: true,
    tags: ['Pets', 'Dog', 'Cute', 'Puppy'],
    description: 'A little fluffy maltipoo puppy sitting softly by the bright window looking quizzically.',
    source: 'default',
  },
  {
    id: 'seed-red-fox-snow',
    title: 'Crimson fox in winter snowfall',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1474511320723-9a56873ee67b?w=1400&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873ee67b?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2340000,
    dateAdded: '2022-10-11T16:40:00Z',
    dateLabel: 'October 11, 2022',
    year: 2022,
    dimensions: { width: 1400, height: 1050 },
    aspectRatio: 4 / 3,
    isFavorite: true,
    tags: ['Wildlife', 'Fox', 'Winter', 'Snow', 'Animals'],
    description: 'Wild red fox with a thick bushy tail pausing alertly against crisp powdery white snow.',
    source: 'default',
  },
  {
    id: 'seed-sea-turtle-reef',
    title: 'Green sea turtle gliding over tropical reef',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3100000,
    dateAdded: '2022-10-12T13:20:00Z',
    dateLabel: 'October 12, 2022',
    year: 2022,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: false,
    tags: ['Ocean', 'Turtle', 'Coral', 'Underwater', 'Marine'],
    description: 'Gentle marine turtle paddling smoothly through sun-dappled turquoise water over coral gardens.',
    source: 'default',
  },
  {
    id: 'seed-cute-kitten-sunbeam',
    title: 'Ginger kitten resting in morning sunbeam',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 1980000,
    dateAdded: '2022-10-13T10:30:00Z',
    dateLabel: 'October 13, 2022',
    year: 2022,
    dimensions: { width: 1200, height: 900 },
    aspectRatio: 4 / 3,
    isFavorite: true,
    tags: ['Cat', 'Kitten', 'Cute', 'Pets'],
    description: 'Adorable striped kitten curled up comfortably in a warm diagonal ray of morning sunlight.',
    source: 'default',
  },
  {
    id: 'seed-horses-pasture-mountains',
    title: 'Wild horses on green alpine plateau',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1800&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3890000,
    dateAdded: '2022-10-14T11:20:00Z',
    dateLabel: 'October 14, 2022',
    year: 2022,
    dimensions: { width: 2000, height: 1000 },
    aspectRatio: 2,
    isFavorite: true,
    tags: ['Animals', 'Horses', 'Mountains', 'Pasture'],
    description: 'Pair of mountain horses peacefully grazing in the high alpine meadows.',
    source: 'default',
  },
  {
    id: 'seed-koi-pond-garden',
    title: 'Koi fish swimming in freshwater garden',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0b2d?w=1200&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0b2d?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2600000,
    dateAdded: '2022-10-15T15:00:00Z',
    dateLabel: 'October 15, 2022',
    year: 2022,
    dimensions: { width: 1000, height: 1200 },
    aspectRatio: 5 / 6,
    isFavorite: false,
    tags: ['Zen', 'Pond', 'Fish', 'Garden'],
    description: 'Graceful red and white koi fish swimming beneath aquatic plant foliage.',
    source: 'default',
  },

  // 5. Cozy Living, Workspace & Culinary
  {
    id: 'seed-cozy-coffee-latte',
    title: 'Morning artisan sandwich and latte',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=1200&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 1950000,
    dateAdded: '2022-10-16T08:15:00Z',
    dateLabel: 'October 16, 2022',
    year: 2022,
    dimensions: { width: 1200, height: 1200 },
    aspectRatio: 1,
    isFavorite: true,
    tags: ['Food', 'Coffee', 'Breakfast', 'Cozy'],
    description: 'Fresh grilled sourdough melt with a cup of hot crafted latte and latte art foam.',
    source: 'default',
  },
  {
    id: 'seed-matcha-ceremony',
    title: 'Artisanal ceremonial matcha green tea',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=1200&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2100000,
    dateAdded: '2022-10-17T10:45:00Z',
    dateLabel: 'October 17, 2022',
    year: 2022,
    dimensions: { width: 1200, height: 1200 },
    aspectRatio: 1,
    isFavorite: false,
    tags: ['Matcha', 'Zen', 'Tea', 'Minimal'],
    description: 'Rich frothy Uji matcha served in a handcrafted ceramic chawan with a bamboo chasen.',
    source: 'default',
  },
  {
    id: 'seed-minimal-desk-workspace',
    title: 'Minimalist designer desk with mechanical keyboard',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2850000,
    dateAdded: '2022-10-18T14:20:00Z',
    dateLabel: 'October 18, 2022',
    year: 2022,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: false,
    tags: ['Workspace', 'Desk', 'Minimal', 'Tech'],
    description: 'Clean oak desk setup with ultra-wide monitor, potted succulent, and warm indirect ambient lighting.',
    source: 'default',
  },
  {
    id: 'seed-starry-night-campfire',
    title: 'Milky Way galaxy over mountain campfire',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3400000,
    dateAdded: '2022-10-19T22:30:00Z',
    dateLabel: 'October 19, 2022',
    year: 2022,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Campfire', 'Stars', 'MilkyWay', 'Night', 'Adventure'],
    description: 'Glowing campfire embers crackling underneath billions of glittering stars in the cosmic Milky Way arch.',
    source: 'default',
  },
  {
    id: 'seed-dewdrops-macro-leaf',
    title: 'Crystal dew drops glistening on emerald leaf',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1400&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 2300000,
    dateAdded: '2022-10-20T07:50:00Z',
    dateLabel: 'October 20, 2022',
    year: 2022,
    dimensions: { width: 1400, height: 1050 },
    aspectRatio: 4 / 3,
    isFavorite: false,
    tags: ['Macro', 'Water', 'Nature', 'Green'],
    description: 'Microscopic spherical water drops magnifying the intricate cellular vein patterns of a tropical leaf.',
    source: 'default',
  },
  {
    id: 'seed-vibrant-fluid-acrylic',
    title: 'Fluid cosmic acrylic paint swirl texture',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80',
    mimeType: 'image/jpeg',
    size: 3600000,
    dateAdded: '2022-10-21T16:00:00Z',
    dateLabel: 'October 21, 2022',
    year: 2022,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    isFavorite: true,
    tags: ['Art', 'Abstract', 'Color', 'Texture'],
    description: 'Hypnotic marbled fluid pigments merging royal blue, magenta, and shimmering metallic gold veins.',
    source: 'default',
  },

  // 6. Multimedia: Videos, Audio & Documents
  {
    id: 'seed-night-city-skyline-video',
    title: 'Metropolis night reflections (Video)',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    size: 15400000,
    dateAdded: '2022-10-22T21:30:00Z',
    dateLabel: 'October 22, 2022',
    year: 2022,
    dimensions: { width: 1400, height: 1050 },
    aspectRatio: 4 / 3,
    duration: 15,
    isFavorite: true,
    tags: ['Video', 'Night', 'City', 'Timelapse'],
    description: 'Cinematic night skyline illuminated across the tranquil marina.',
    source: 'default',
  },
  {
    id: 'seed-turquoise-lagoon-boat-video',
    title: 'Turquoise island lagoon cruise (Video)',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    size: 18200000,
    dateAdded: '2022-10-23T13:45:00Z',
    dateLabel: 'October 23, 2022',
    year: 2022,
    dimensions: { width: 1920, height: 1080 },
    aspectRatio: 16 / 9,
    duration: 15,
    isFavorite: true,
    tags: ['Video', 'Lagoon', 'Island', 'Sea'],
    description: 'Gentle waves rolling past wooden fishing boats anchored along the turquoise bay.',
    source: 'default',
  },
  {
    id: 'seed-peaceful-lofi-track',
    title: 'Gentle Morning Acoustic Stream (Audio)',
    type: 'audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    mimeType: 'audio/mp3',
    size: 6120000,
    dateAdded: '2023-04-10T10:00:00Z',
    dateLabel: 'April 10, 2023',
    year: 2023,
    dimensions: { width: 800, height: 800 },
    aspectRatio: 1,
    duration: 372,
    isFavorite: true,
    tags: ['Audio', 'Acoustic', 'Music', 'Relax'],
    description: 'Calm ambient acoustic rhythm for deep focus and relaxation.',
    source: 'default',
  },
  {
    id: 'seed-vone-welcome-guide',
    title: 'Sparkle User Handbook & Shortcuts.pdf',
    type: 'document',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
    mimeType: 'application/pdf',
    size: 142000,
    dateAdded: '2023-08-20T14:30:00Z',
    dateLabel: 'August 20, 2023',
    year: 2023,
    dimensions: { width: 1200, height: 1600 },
    aspectRatio: 3 / 4,
    isFavorite: false,
    tags: ['Document', 'PDF', 'Guide'],
    description: 'Documentation guide and keybind reference for Sparkle.',
    source: 'default',
  },
  {
    id: 'seed-vone-project-brief-docx',
    title: 'Sparkle Project Roadmap & Requirements.docx',
    type: 'document',
    url: 'https://calibre-ebook.com/downloads/demos/demo.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 285000,
    dateAdded: '2023-09-05T10:15:00Z',
    dateLabel: 'September 5, 2023',
    year: 2023,
    dimensions: { width: 1200, height: 1600 },
    aspectRatio: 3 / 4,
    isFavorite: true,
    tags: ['Word', 'DOCX', 'Document', 'Roadmap'],
    description: 'Word document outlining system design and milestone goals.',
    source: 'default',
  },
  {
    id: 'seed-channel-frequency-sheet-xlsx',
    title: 'Vietnam TV Channels Frequency List.xlsx',
    type: 'document',
    url: 'https://go.microsoft.com/fwlink/?LinkID=521962',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 420000,
    dateAdded: '2023-11-01T09:30:00Z',
    dateLabel: 'November 1, 2023',
    year: 2023,
    dimensions: { width: 1600, height: 1200 },
    aspectRatio: 4 / 3,
    isFavorite: false,
    tags: ['Excel', 'XLSX', 'Spreadsheet', 'Data'],
    description: 'Spreadsheet database containing national channel streams and transponder data.',
    source: 'default',
  }
];

class GalleryDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private listeners: Set<() => void> = new Set();

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('dateAdded', 'dateAdded', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('isFavorite', 'isFavorite', { unique: false });
        }
        if (!db.objectStoreNames.contains(FOLDER_STORE_NAME)) {
          db.createObjectStore(FOLDER_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Subscribe to changes
  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    });
  }

  // Load all items (gallery starts empty by default; user can upload or click Load Demo)
  public async getAll(): Promise<GalleryMediaItem[]> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      let items: GalleryMediaItem[] = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      // For Samples Demo Mode: Auto-seed rich sample items if the gallery is empty
      const initializedDemo = localStorage.getItem('vone_gallery_samples_demo_mode_v4');
      if (!initializedDemo) {
        if (items.length === 0) {
          localStorage.setItem('vone_gallery_samples_demo_mode_v4', 'true');
          setTimeout(() => {
            this.seedDefaults().catch(console.error);
          }, 0);
          items = [...DEFAULT_GALLERY_ITEMS];
        } else {
          localStorage.setItem('vone_gallery_samples_demo_mode_v4', 'true');
        }
      }

      // Sort newest first
      return items.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    } catch (err) {
      console.warn('IndexedDB read failed:', err);
      return [];
    }
  }

  public async seedDefaults(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const item of DEFAULT_GALLERY_ITEMS) {
        store.put(item);
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      localStorage.setItem('vone_gallery_initialized', 'true');
      localStorage.setItem('vone_gallery_build_261019_init', 'true');
      this.notify();
    } catch (e) {
      console.error('Failed to seed defaults', e);
    }
  }

  // Add single media item
  public async add(item: GalleryMediaItem): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(item);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      localStorage.setItem('vone_gallery_initialized', 'true');
      this.notify();
    } catch (e) {
      console.error('Failed to add gallery item', e);
      throw e;
    }
  }

  // Delete single media item
  public async delete(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      this.notify();
    } catch (e) {
      console.error('Failed to delete gallery item', e);
    }
  }

  // Duplicate media item
  public async duplicate(id: string): Promise<GalleryMediaItem | null> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      const item: GalleryMediaItem | undefined = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (item) {
        const newItem: GalleryMediaItem = {
          ...item,
          id: `copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: `Copy of ${item.title}`,
          dateAdded: new Date().toISOString(),
          isFavorite: false,
        };
        store.put(newItem);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        this.notify();
        return newItem;
      }
      return null;
    } catch (e) {
      console.error('Failed to duplicate item', e);
      return null;
    }
  }

  // Delete multiple items
  public async deleteMany(ids: string[]): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of ids) {
        store.delete(id);
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      this.notify();
    } catch (e) {
      console.error('Failed to delete items', e);
    }
  }

  // Toggle favorite
  public async toggleFavorite(id: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      const item: GalleryMediaItem | undefined = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (item) {
        item.isFavorite = !item.isFavorite;
        store.put(item);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        this.notify();
        return item.isFavorite;
      }
      return false;
    } catch (e) {
      console.error('Failed to toggle favorite', e);
      return false;
    }
  }

  // Clear all items (to test empty state!)
  public async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      localStorage.setItem('vone_gallery_initialized', 'true');
      this.notify();
    } catch (e) {
      console.error('Failed to clear gallery', e);
    }
  }

  private async patchItems(ids: string[], patch: (item: GalleryMediaItem) => void): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const id of ids) {
      const req = store.get(id);
      req.onsuccess = () => {
        const item = req.result as GalleryMediaItem | undefined;
        if (item) {
          patch(item);
          store.put(item);
        }
      };
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    this.notify();
  }

  public async rename(id: string, title: string): Promise<void> {
    await this.patchItems([id], (item) => {
      item.title = title;
    });
  }

  public async moveToFolder(ids: string[], folderId: string | null): Promise<void> {
    await this.patchItems(ids, (item) => {
      item.folderId = folderId;
    });
  }

  public async getFolders(): Promise<GalleryFolder[]> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(FOLDER_STORE_NAME, 'readonly');
      const req = tx.objectStore(FOLDER_STORE_NAME).getAll();
      const folders: GalleryFolder[] = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      return folders.sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.warn('Failed to read folders', e);
      return [];
    }
  }

  public async createFolder(name: string): Promise<GalleryFolder> {
    const folder: GalleryFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      dateCreated: new Date().toISOString(),
    };
    const db = await this.openDB();
    const tx = db.transaction(FOLDER_STORE_NAME, 'readwrite');
    tx.objectStore(FOLDER_STORE_NAME).put(folder);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    this.notify();
    return folder;
  }

  public async renameFolder(id: string, name: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(FOLDER_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FOLDER_STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) store.put({ ...req.result, name });
    };
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    this.notify();
  }

  // Deleting a folder moves its contents back to the Gallery root
  public async deleteFolder(id: string): Promise<void> {
    const items = await this.getAll();
    const childIds = items.filter((it) => it.folderId === id).map((it) => it.id);
    if (childIds.length) await this.moveToFolder(childIds, null);
    const db = await this.openDB();
    const tx = db.transaction(FOLDER_STORE_NAME, 'readwrite');
    tx.objectStore(FOLDER_STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    this.notify();
  }

  // Restore sample items
  public async restoreSamples(): Promise<void> {
    await this.clearAll();
    await this.seedDefaults();
  }
}

export const galleryDB = new GalleryDatabase();

// Helper to determine media aspect ratio from file
export const getMediaDimensions = async (
  file: File
): Promise<{ width: number; height: number; duration?: number }> => {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 600;
        URL.revokeObjectURL(url);
        resolve({ width: w, height: h });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 800, height: 600 });
      };
      img.src = url;
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        const dur = Math.round(video.duration) || 0;
        URL.revokeObjectURL(url);
        resolve({ width: w, height: h, duration: dur });
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 1280, height: 720, duration: 0 });
      };
      video.src = url;
    } else {
      // Audio or documents default
      resolve({ width: 600, height: 600 });
    }
  });
};
