export interface MemoryItem {
  id: string;
  title: string;
  date: string;
  caption: string;
  tag: string;
  accentColor: string;
  photoUrl?: string;
  altText: string;
}

export interface FlowerNoteItem {
  id: string;
  emoji: string;
  name: string;
  title: string;
  note: string;
  color: string;
  petalCount: number;
}

export interface SecretSurprise {
  badge: string;
  title: string;
  headline: string;
  subtitle: string;
  perks: string[];
  couponCode: string;
  validity: string;
  finePrint: string;
}

export interface FinalLetter {
  salutation: string;
  paragraphs: string[];
  closing: string;
  signature: string;
  postScript?: string;
}

export interface GiftConfig {
  giftTitle: string;
  recipientName: string;
  senderName: string;
  welcome: {
    badge: string;
    headline: string;
    subtitle: string;
    enterButtonText: string;
    soundPromptText: string;
  };
  garden: {
    quote: string;
    guideTip: string;
  };
  memories: MemoryItem[];
  flowerNotes: FlowerNoteItem[];
  surprise: SecretSurprise;
  letter: FinalLetter;
}

export const giftContent: GiftConfig = {
  giftTitle: "Perfect Time 🌷",
  recipientName: "My Favorite Person",
  senderName: "Forever Yours",
  welcome: {
    badge: "A Private Gift For You",
    headline: "Welcome to Our Garden",
    subtitle: "A quiet starlit corner of memories, little surprises, and appreciation.",
    enterButtonText: "Step into the Garden ✨",
    soundPromptText: "Tap anywhere to begin with ambient sound",
  },
  garden: {
    quote: "“In the garden of gentle moments, every bloom reminds me of you.”",
    guideTip: "Explore the path: tap glowing blossoms, flip memories, and discover hidden secrets along the trail.",
  },
  memories: [
    {
      id: "mem-1",
      title: "Where It All Began",
      date: "The First Hello",
      caption: "You smiled, and suddenly the whole world felt warm, easy, and completely right.",
      tag: "First Sparks",
      accentColor: "#f472b6",
      photoUrl: "/assets/memories/memory-1.jpg",
      altText: "A warm golden memory of meeting for the first time",
    },
    {
      id: "mem-2",
      title: "Late Night Conversations",
      date: "Talking Past 2 AM",
      caption: "Whispering about our biggest dreams and silly secrets until neither of us wanted to say goodnight.",
      tag: "Comfort",
      accentColor: "#a78bfa",
      photoUrl: "/assets/memories/memory-2.jpg",
      altText: "Cozy nighttime atmosphere with fairy lights",
    },
    {
      id: "mem-3",
      title: "Our Rainy Day Escape",
      date: "Spontaneous Road Trip",
      caption: "Running through sudden raindrops, sharing an oversized umbrella, and laughing all the way home.",
      tag: "Adventure",
      accentColor: "#38bdf8",
      photoUrl: "/assets/memories/memory-3.jpg",
      altText: "Rain drops on a cozy coffee shop window",
    },
    {
      id: "mem-4",
      title: "Laughing Until We Couldn't Breathe",
      date: "That One Inside Joke",
      caption: "That ridiculous moment no one else would ever understand. My cheeks still hurt thinking about it.",
      tag: "Pure Joy",
      accentColor: "#fbbf24",
      photoUrl: "/assets/memories/memory-4.jpg",
      altText: "Warm sunset laughter and happy times",
    },
    {
      id: "mem-5",
      title: "Quiet Comfort in Silence",
      date: "A Sunday Afternoon",
      caption: "Reading side-by-side, feet tangled, mugs in hand. Proof that existing together is the greatest luxury.",
      tag: "Peace",
      accentColor: "#34d399",
      photoUrl: "/assets/memories/memory-5.jpg",
      altText: "Warm tea cups and a cozy blanket",
    },
    {
      id: "mem-6",
      title: "Right Here, Right Now",
      date: "Every Single Day",
      caption: "Every morning that starts with you and every night that ends with you is my new favorite memory.",
      tag: "Forever",
      accentColor: "#fb7185",
      photoUrl: "/assets/memories/memory-6.jpg",
      altText: "Romantic rose petals under twilight stars",
    },
  ],
  flowerNotes: [
    {
      id: "note-1",
      emoji: "🌷",
      name: "Blushing Tulip",
      title: "Your Thoughtful Kindness",
      note: "The gentle, selfless way you notice how others feel and bring comfort before anyone even asks. It touches me deeply.",
      color: "#f472b6",
      petalCount: 6,
    },
    {
      id: "note-2",
      emoji: "🌹",
      name: "Velvet Rose",
      title: "Your Infectious Laugh",
      note: "It is my absolute favorite sound in the world. Even on the heaviest days, hearing you laugh instantly dissolves the storm.",
      color: "#fb7185",
      petalCount: 8,
    },
    {
      id: "note-3",
      emoji: "🌸",
      name: "Cherry Blossom",
      title: "The Way You Think",
      note: "Your curiosity, your bright perspective, and the thoughtful questions you ask. I could listen to you think out loud for hours.",
      color: "#ec4899",
      petalCount: 5,
    },
    {
      id: "note-4",
      emoji: "🌼",
      name: "Golden Daisy",
      title: "My Safe Haven",
      note: "With you, I never have to wear a mask or pretend. You make me feel completely safe, understood, and at peace.",
      color: "#f59e0b",
      petalCount: 12,
    },
    {
      id: "note-5",
      emoji: "🪻",
      name: "Twilight Lavender",
      title: "Our Quiet Future",
      note: "Every dream of the future I have has your hand in mine. Growing together with you is the adventure of my lifetime.",
      color: "#a855f7",
      petalCount: 7,
    },
  ],
  surprise: {
    badge: "SECRET GARDEN DISCOVERY ✨",
    title: "Golden Date Night Pass",
    headline: "You Discovered the Hidden Secret!",
    subtitle: "A token of appreciation redeemable at any moment of your choosing.",
    perks: [
      "Any dinner or sweet treat of your absolute choice (no debates!)",
      "Unlimited cuddles and an attentive 20-minute shoulder massage",
      "Veto power over what movie or show we watch next",
      "One full day of unconditional pampering and royal treatment",
    ],
    couponCode: "PERFECT-TIME-FOREVER",
    validity: "Valid for a lifetime • Non-transferable • Infinite re-uses allowed",
    finePrint: "Presented with love and a promise to always make time for the things that bring us joy.",
  },
  letter: {
    salutation: "My Dearest,",
    paragraphs: [
      "If you've reached this corner of the garden, you have walked through just a few of the countless moments that make you so irreplaceable to me.",
      "I wanted to create something quiet, beautiful, and lasting for you—a private little sanctuary you can open anytime on your phone whenever you need to be reminded of how deeply and genuinely loved you are.",
      "Thank you for being my favorite person to talk to, my safe harbor when things get noisy, and the brightest part of every single day. The world can be fast and overwhelming, but with you, everything feels like the perfect time.",
      "Keep this garden in your pocket. Whenever you visit, know that my heart is always right here with you.",
    ],
    closing: "Forever & always with all my heart,",
    signature: "Yours truly ❤️",
    postScript: "P.S. Tap the button below to add this garden directly to your home screen so you can visit anytime.",
  },
};
