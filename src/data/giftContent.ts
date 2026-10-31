export interface MemoryItem {
  id: string;
  title: string;
  date: string;
  caption: string;
  tag: string;
  accentColor: string;
  photoUrl?: string;
  altText: string;
  objectPosition?: string;
  filter?: string;
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
  giftTitle: "Perfect Time ✨",
  recipientName: "Noella",
  senderName: "Solomon",
  welcome: {
    badge: "A Special Keepsake ✨",
    headline: "Welcome to Your Garden, Noella ✨",
    subtitle: "A private corner crafted for you—celebrating our favorite moments, inside jokes, and the memories we keep building.",
    enterButtonText: "Step into the Garden ✨",
    soundPromptText: "Tap anywhere to begin with ambient sound",
  },
  garden: {
    quote: "“Time doesn't lie. Always trust in the timing, celebrate how far we've come, and keep shining.”",
    guideTip: "Explore our path: flip through polaroids, check out petal notes, and unseal your personal letter.",
  },
  memories: [
    {
      id: "mem-1",
      title: "Partners in Crime",
      date: "Classroom Chaos",
      caption: "Supposed to be paying attention in class, but we were too busy taking silly photos and laughing at nonsense. 10/10 would slack off again.",
      tag: "Zero Focus",
      accentColor: "#f472b6",
      photoUrl: "/assets/memories/photo-desk-selfie.jpg",
      altText: "Playful classroom selfie sitting together at the desk",
      objectPosition: "center 55%",
    },
    {
      id: "mem-2",
      title: "The Hand-Hold Moment",
      date: "Caught in 4K",
      caption: "Not gonna lie, holding your hand was pretty sweet. Proof that when we're together, the chemistry is completely effortless.",
      tag: "The Vibe",
      accentColor: "#34d399",
      photoUrl: "/assets/memories/photo-holding-hands.jpg",
      altText: "Tender close-up of our hands clasped tightly together",
      objectPosition: "center 30%",
    },
    {
      id: "mem-3",
      title: "Zero-Filter Laughter",
      date: "Cheeks Still Hurting",
      caption: "That moment an inside joke took over and we completely lost our composure. Your laugh is dangerously contagious.",
      tag: "Pure Chaos",
      accentColor: "#fbbf24",
      photoUrl: "/assets/memories/photo-goofy-laugh.jpg",
      altText: "Hilarious goofy selfie laughing together",
      objectPosition: "center center",
    },
    {
      id: "mem-4",
      title: "Evening Moves",
      date: "Post-Class Dinner",
      caption: "Chilling outside our spot under the cool evening sky. Good food and late talks with you always hit different.",
      tag: "Night Vibes",
      accentColor: "#38bdf8",
      photoUrl: "/assets/memories/photo-twilight-date.jpg",
      altText: "Evening twilight selfie together outside the restaurant",
      objectPosition: "center 70%",
      filter: "brightness(1.15) contrast(1.05)",
    },
    {
      id: "mem-5",
      title: "Okay, Miss Photogenic",
      date: "Golden Hour Glow",
      caption: "Had to include this one because you looked genuinely gorgeous here. Don't let it inflate your ego too much though.",
      tag: "Stunning",
      accentColor: "#fb7185",
      photoUrl: "/assets/memories/photo-sun-portrait.jpg",
      altText: "Warm sunny portrait looking directly into the camera",
      objectPosition: "center 20%",
    },
    {
      id: "mem-6",
      title: "Signature Noella Energy",
      date: "Balcony Sunshine",
      caption: "Double peace signs, wild smile, and 100% unapologetic energy. You're easily one of my favorite people to be around.",
      tag: "Iconic",
      accentColor: "#a855f7",
      photoUrl: "/assets/memories/photo-balcony-peace.jpg",
      altText: "Playful balcony portrait posing with double peace signs",
      objectPosition: "center 20%",
      filter: "brightness(1.22) contrast(1.06)",
    },
  ],
  flowerNotes: [
    {
      id: "note-1",
      emoji: "🌷",
      name: "Blushing Tulip",
      title: "That Effortless Energy",
      note: "You have this natural spark that instantly turns a dull day or boring lecture into something fun.",
      color: "#f472b6",
      petalCount: 6,
    },
    {
      id: "note-2",
      emoji: "🌹",
      name: "Velvet Rose",
      title: "That Wild Laugh",
      note: "Loud, genuine, and impossible not to smile back at. Definitely one of your absolute best features.",
      color: "#fb7185",
      petalCount: 8,
    },
    {
      id: "note-3",
      emoji: "🌸",
      name: "Cherry Blossom",
      title: "How Quick-Witted You Are",
      note: "Behind all the teasing and playful chaos, you're sharp as hell. I love the way your mind works.",
      color: "#ec4899",
      petalCount: 5,
    },
    {
      id: "note-4",
      emoji: "🌼",
      name: "Golden Daisy",
      title: "Unmatched Comfort",
      note: "Zero pretense, zero awkwardness. Hanging out with you feels comfortable from second one.",
      color: "#f59e0b",
      petalCount: 12,
    },
    {
      id: "note-5",
      emoji: "🪻",
      name: "Twilight Lavender",
      title: "Always in Your Corner",
      note: "Great friend, special connection, and definitely someone I always want around. Excited for whatever we get up to next.",
      color: "#a855f7",
      petalCount: 7,
    },
  ],
  surprise: {
    badge: "SPECIAL PERK CARD ✨",
    title: "The 'Noella Gets Her Way' Pass",
    headline: "You Found the Secret Pass!",
    subtitle: "A permanent perk card redeemable anytime you want to hang out, grab food, or call in a favor.",
    perks: [
      "One free snack or dinner run on Solomon (your absolute pick, no debates)",
      "Complete aux cord & music control whenever we're hanging out",
      "One 'Get Out of Trouble' card next time we're roasting each other",
      "Guaranteed top-tier energy, laughs, and solid support anytime you need it",
    ],
    couponCode: "NOELLA-VIP-PASS",
    validity: "Non-expiring • Solomon guaranteed",
    finePrint: "Terms: Redeemable anytime. Must be accompanied by good vibes and the usual laughs.",
  },
  letter: {
    salutation: "Hey Noella,",
    paragraphs: [
      "Back on your birthday a couple of months ago, I wrote down a note for you in my book. But words on paper felt like only half the story, so I wanted to turn those thoughts into something lasting—a private little sanctuary you can keep on your phone.",
      "Like I wrote back then: things might sometimes feel like they're worlds away, but trust me—time doesn't lie. Always trust in the timing, because everything falls into place right when it's meant to.",
      "I believe in keeping things solid: while I won't make cliché promises about handing you the world, what you'll always have from me is my absolute best—my time, my energy, and a true friend firmly in your corner.",
      "You've been an incredible person in my life, and I've genuinely appreciated your support since day one, as well as the belief you've consistently had in me and the process.",
      "Keep that unmatched energy, keep being the amazing person you are, and never lose that spark. Consider this your special gift, perfected just for you.",
    ],
    closing: "With high regards & big love,",
    signature: "¡Feliz cumpleaños to you, m'luv — Solomon ✨",
    postScript: "P.S. Tap the button below to add this garden to your phone's home screen so you can keep this memory handy!",
  },
};
