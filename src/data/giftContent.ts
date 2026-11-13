export interface MemoryItem {
  id: string;
  title: string;
  date: string;
  caption: string;
  tag: string;
  accentColor: string;
  photoUrl?: string;
  videoUrl?: string;
  videoMediaId?: string;
  mediaType?: 'photo' | 'video';
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

export interface PerkOption {
  id: string;
  emoji: string;
  title: string;
  description: string;
  category: string;
}

export interface SecretSurprise {
  badge: string;
  title: string;
  headline: string;
  subtitle: string;
  perks: string[];
  perkOptions: PerkOption[];
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

export interface TimingNote {
  badge: string;
  headline: string;
  originalContext: string;
  journalExcerpt: string[];
  reflection: string;
  coreThemes: {
    icon: string;
    label: string;
    description: string;
  }[];
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
  timing: TimingNote;
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
  timing: {
    badge: "The Heartbeat of the Garden",
    headline: "Trusting the Timing",
    originalContext: "From Solomon's journal note on your birthday",
    journalExcerpt: [
      "Things might sometimes feel like they're worlds away, but trust me—time doesn't lie.",
      "Always trust in the timing, celebrate how far we've come, and know that what you'll always have from me is my absolute best."
    ],
    reflection: "Moments can't be rushed. Every laugh shared, every quiet talk, and every memory brought us right here to this perfect time.",
    coreThemes: [
      {
        icon: "⏳",
        label: "Time Doesn't Lie",
        description: "Everything falls into place right when it's supposed to."
      },
      {
        icon: "🌟",
        label: "My Absolute Best",
        description: "No empty cliché promises—just genuine time, energy, and loyalty."
      },
      {
        icon: "🤝",
        label: "Firmly in Your Corner",
        description: "A solid friend and steady presence, through every chapter."
      }
    ]
  },
  garden: {
    quote: "“Time doesn't lie. Always trust in the timing, celebrate how far we've come, and keep shining.”",
    guideTip: "Explore our path: flip through polaroids, check out petal notes, and unseal your personal letter.",
  },
  memories: [
    {
      id: "mem-2",
      title: "The Hand-Hold Moment",
      date: "Caught in 4K",
      caption: "Not gonna lie, holding your hand was pretty sweet. Proof that when we're together, the chemistry is completely effortless.",
      tag: "The Vibe",
      accentColor: "#34d399",
      photoUrl: "/assets/memories/photo-holding-hands.jpg",
      altText: "Tender close-up of our hands clasped tightly together",
      objectPosition: "center center",
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
      objectPosition: "center center",
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
      objectPosition: "center center",
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
    badge: "VIP PERK CARD ✨",
    title: "The 'Noella Gets Her Way' Pass",
    headline: "You Found the Secret Pass!",
    subtitle: "A permanent perk card redeemable anytime you want to hang out, grab food, or call in a favor.",
    perks: [
      "One free snack or dinner run on Solomon (your absolute pick, no debates)",
      "Complete aux cord & music control whenever we're hanging out",
      "One 'Get Out of Trouble' card next time we're roasting each other",
      "Guaranteed top-tier energy, laughs, and solid support anytime you need it",
    ],
    perkOptions: [
      {
        id: "food-run",
        emoji: "🍕",
        title: "Snack & Dinner Run on Solomon",
        description: "Your absolute pick, no debates, no budget excuses. Whatever craving hits you.",
        category: "Treat",
      },
      {
        id: "aux-cord",
        emoji: "🎵",
        title: "Aux Cord & Playlist Reign",
        description: "100% uninterrupted DJ control whenever we're hanging out. Solomon is not allowed to skip.",
        category: "Music",
      },
      {
        id: "trouble-card",
        emoji: "🃏",
        title: "'Get Out of Trouble' Immunity Card",
        description: "Instant, unconditional victory the next time we're roasting each other or debating.",
        category: "Immunity",
      },
      {
        id: "hangout-day",
        emoji: "☕",
        title: "Spontaneous Hangout & Late-Night Talks",
        description: "Good food, chill vibes, great laughs, and zero stress on a day of your choice.",
        category: "Hangout",
      },
      {
        id: "wildcard",
        emoji: "🌟",
        title: "The Noella Wildcard Favor",
        description: "Need a lift, someone to listen, or study backup? Solomon is on call, no questions asked.",
        category: "VIP",
      },
    ],
    couponCode: "NOELLA-VIP-PASS",
    validity: "Non-expiring • Solomon guaranteed",
    finePrint: "Terms: Redeemable anytime. Must be accompanied by good vibes and the usual laughs.",
  },
  letter: {
    salutation: "Hey Noella,",
    paragraphs: [
      "Back on your birthday a couple of months ago, I jotted down a note in my journal for you. Words on paper felt like only half the story though, so I wanted to turn those thoughts into something real—a little digital sanctuary you can carry on your phone whenever you need a smile.",
      "Like I wrote back then: things might sometimes feel like they're worlds away, but trust me—time doesn't lie. Always trust in the timing, celebrate how far we've come, and know that everything falls into place right when it's meant to.",
      "I've always believed in keeping things genuine: while I won't make cliché promises about handing you the moon and stars, what you'll always have from me is my absolute best—my time, my energy, and a true friend who's firmly in your corner.",
      "You've been an incredible person in my life. I've genuinely appreciated your support from day one, and the quiet belief you've consistently had in me and the process means more to me than I usually let on.",
      "Keep that unmatched energy, keep being the funny, sharp, gorgeous soul that you are, and never lose that spark. Consider this your special keepsake, made just for you.",
    ],
    closing: "With high regards & big love,",
    signature: "¡Feliz cumpleaños to you, m'luv — Solomon ✨",
    postScript: "P.S. Make sure you redeem that VIP pass above—I'm legally obligated to honor it! 😄",
  },
};
