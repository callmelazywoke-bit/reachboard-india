import type { Category } from './types';

export const CATEGORIES: Category[] = [
  // Creators
  { id: 'motion_graphics_3d', name: 'Motion Graphics & 3D', type: 'creator', icon: 'Boxes', keywords: ['motion','graphics','3d','animation','after effects','cinema 4d','blender','vfx','cgi','render'], hashtags: ['#motiongraphics','#3danimation','#aftereffects','#cinema4d','#blender3d','#vfx'] },
  { id: 'video_editors', name: 'Video Editors', type: 'creator', icon: 'Film', keywords: ['edit','editing','premiere','davinci','final cut','color grading','transitions','cut','post production'], hashtags: ['#videoediting','#premierepro','#davinciresolve','#colorgrading','#postproduction'] },
  { id: 'storytellers_filmmakers', name: 'Storytellers & Filmmakers', type: 'creator', icon: 'Clapperboard', keywords: ['story','film','filmmaker','cinema','short film','documentary','director','screenplay','narrative'], hashtags: ['#filmmaking','#storytelling','#shortfilm','#documentary','#indiefilm'] },
  { id: 'dancers_choreographers', name: 'Dancers & Choreographers', type: 'creator', icon: 'Music2', keywords: ['dance','dancer','choreography','choreographer','bollywood','classical','hip hop','contemporary','freestyle'], hashtags: ['#dance','#choreography','#dancer','#bollywooddance','#dancevideo'] },
  { id: 'musicians_singers', name: 'Musicians & Singers', type: 'creator', icon: 'Mic2', keywords: ['music','musician','singer','song','vocals','guitar','piano','cover','original','band','rap'], hashtags: ['#music','#singer','#musician','#originalmusic','#cover'] },
  { id: 'comedians_memers', name: 'Comedians & Memers', type: 'creator', icon: 'Laugh', keywords: ['comedy','comedian','meme','funny','skit','parody','humor','joke','standup','satire'], hashtags: ['#comedy','#memes','#funny','#skit','#standupcomedy'] },
  { id: 'tech_creators', name: 'Tech Creators', type: 'creator', icon: 'Cpu', keywords: ['tech','technology','gadgets','review','smartphone','laptop','ai','coding','programming','software','hardware'], hashtags: ['#tech','#gadgets','#techreview','#smartphone','#ai'] },
  { id: 'gamers', name: 'Gamers', type: 'creator', icon: 'Gamepad2', keywords: ['gaming','gamer','gameplay','bgmi','valorant','pubg','freefire','minecraft','stream','esports'], hashtags: ['#gaming','#gamer','#bgmi','#valorant','#gameplay'] },
  { id: 'artists_illustrators', name: 'Artists & Illustrators', type: 'creator', icon: 'Palette', keywords: ['art','artist','illustration','drawing','painting','sketch','digital art','watercolor','portrait'], hashtags: ['#art','#illustration','#drawing','#digitalart','#sketching'] },
  { id: 'fitness_athletes', name: 'Fitness & Athletes', type: 'creator', icon: 'Dumbbell', keywords: ['fitness','gym','workout','athlete','training','calisthenics','bodybuilding','cardio','yoga','health'], hashtags: ['#fitness','#gym','#workout','#athlete','#training'] },
  { id: 'beauty_makeup', name: 'Beauty & Makeup', type: 'creator', icon: 'Sparkles', keywords: ['beauty','makeup','skincare','cosmetics','glam','foundation','lipstick','contour','mua','beauty blogger'], hashtags: ['#makeup','#beauty','#skincare','#mua','#beautyblogger'] },
  { id: 'fashion_lifestyle', name: 'Fashion & Lifestyle', type: 'creator', icon: 'Shirt', keywords: ['fashion','style','ootd','outfit','lifestyle','lookbook','streetwear','trend','wardrobe','modeling'], hashtags: ['#fashion','#ootd','#style','#lifestyle','#lookbook'] },
  { id: 'travel_bloggers', name: 'Travel Bloggers', type: 'creator', icon: 'Plane', keywords: ['travel','traveler','wanderlust','trip','journey','explore','adventure','backpacking','destination','tourism'], hashtags: ['#travel','#wanderlust','#travelblogger','#adventure','#explore'] },
  { id: 'food_bloggers', name: 'Food Bloggers', type: 'creator', icon: 'UtensilsCrossed', keywords: ['food','foodie','recipe','cooking','biryani','street food','restaurant','cuisine','chef','baking'], hashtags: ['#food','#foodie','#recipe','#streetfood','#foodblogger'] },
  { id: 'medical_dentists', name: 'Medical & Dentists', type: 'creator', icon: 'Stethoscope', keywords: ['medical','doctor','dentist','health','medicine','clinic','surgery','dental','physician','wellness'], hashtags: ['#medical','#doctor','#dentist','#healthcare','#medicine'] },
  // Businesses
  { id: 'restaurants_cafes', name: 'Restaurants & Cafes', type: 'business', icon: 'Coffee', keywords: ['restaurant','cafe','coffee','dining','menu','food','bistro','eatery','bar','kitchen'], hashtags: ['#restaurant','#cafe','#coffee','#dining','#foodie'] },
  { id: 'candle_home_fragrance', name: 'Candle & Home Fragrance', type: 'business', icon: 'Flame', keywords: ['candle','fragrance','scent','aroma','diffuser','home decor','wax','soy candle','essential oil'], hashtags: ['#candles','#homefragrance','#scentedcandles','#homedecor'] },
  { id: 'handmade_diy_crafts', name: 'Handmade & DIY Crafts', type: 'business', icon: 'Hammer', keywords: ['handmade','craft','diy','artisan','pottery','embroidery','crochet','knitting','crafts','homemade'], hashtags: ['#handmade','#diy','#crafts','#artisan','#pottery'] },
  { id: 'apparel_streetwear', name: 'Apparel & Streetwear', type: 'business', icon: 'Shirt', keywords: ['apparel','clothing','streetwear','fashion','brand','tees','hoodie','sneakers','urban','wear'], hashtags: ['#streetwear','#apparel','#clothingbrand','#fashion','#urbanwear'] },
  { id: 'jewelry', name: 'Jewelry', type: 'business', icon: 'Gem', keywords: ['jewelry','jewellery','gold','silver','diamond','ring','necklace','earrings','bracelet','ornament'], hashtags: ['#jewelry','#jewellery','#gold','#diamonds','#handmadejewelry'] },
  { id: 'skincare_brands', name: 'Skincare Brands', type: 'business', icon: 'Droplet', keywords: ['skincare','skin','beauty','cosmetics','serum','moisturizer','cleanser','glow','natural','organic'], hashtags: ['#skincare','#skin','#beautybrand','#cosmetics','#glow'] },
  { id: 'digital_marketing_agencies', name: 'Digital Marketing Agencies', type: 'business', icon: 'Megaphone', keywords: ['marketing','agency','digital','seo','social media','advertising','branding','ads','campaign','growth'], hashtags: ['#marketing','#digitalmarketing','#seo','#branding','#agency'] },
  { id: 'gyms_studios', name: 'Gyms & Studios', type: 'business', icon: 'Dumbbell', keywords: ['gym','studio','fitness','training','crossfit','pilates','yoga','wellness','health','workout'], hashtags: ['#gym','#fitnessstudio','#crossfit','#yoga','#wellness'] },
  { id: 'dental_health_clinics', name: 'Dental & Health Clinics', type: 'business', icon: 'HeartPulse', keywords: ['dental','clinic','health','medical','dentist','healthcare','hospital','treatment','wellness','therapy'], hashtags: ['#dentalclinic','#healthcare','#medical','#clinic','#wellness'] },
];

export const INDIAN_STATES: string[] = [
  'Maharashtra', 'Delhi NCR', 'Karnataka', 'Jharkhand', 'Tamil Nadu',
  'Uttar Pradesh', 'West Bengal', 'Gujarat', 'Rajasthan', 'Kerala',
  'Telangana', 'Andhra Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh',
  'Bihar', 'Odisha', 'Assam', 'Chhattisgarh', 'Goa',
];

export function getCategoryById(id: string | null): Category | undefined {
  if (!id) return undefined;
  return CATEGORIES.find((c) => c.id === id);
}

export function getCreatorCategories(): Category[] {
  return CATEGORIES.filter((c) => c.type === 'creator');
}

export function getBusinessCategories(): Category[] {
  return CATEGORIES.filter((c) => c.type === 'business');
}
