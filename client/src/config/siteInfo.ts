/**
 * Single source of truth for project and developer details.
 *
 * The About page, Contact page and Footer all read from here, so updating a
 * detail in this file updates it everywhere.
 *
 * >>> VALUES MARKED "PLACEHOLDER" ARE NOT REAL - replace them before launch. <<<
 */

export interface SocialLink {
  name: string;
  url: string;
}

export interface Developer {
  name: string;
  role: string;
  /** Path under /public. Empty string falls back to initials. */
  photo: string;
  email: string;
  github: string;
  linkedin: string;
  portfolio: string;
}

export const siteInfo = {
  /** Public-facing product name */
  name: 'EcoChain',

  /** What this is - a project, not a registered company */
  kind: 'An independent software project',

  /** One-line positioning statement, used under page titles */
  tagline: 'Turning everyday waste into measurable value.',

  /** Year development started. PLACEHOLDER */
  startedYear: 2025,

  /** The people who build and maintain the project */
  developers: [
    {
      name: 'Sahil Mukkawar',
      role: 'Developer',
      photo: '/images/team/sahil-mukkawar.png',
      email: 'mukkawarsahil99@gmail.com',
      github: 'https://github.com/sahilmukkawar',
      linkedin: 'https://www.linkedin.com/in/sahil-mukkawar-1a3401239/',
      portfolio: 'https://sahil-mukkawar.netlify.app/'
    },
    {
      name: 'Aditi Bandewar',
      role: 'Developer',
      photo: '/images/team/aditi-bandewar.png',
      email: 'aditibandewar068@gmail.com',
      github: 'https://github.com/aditi9975',
      linkedin: 'https://www.linkedin.com/in/aditibandewar/',
      portfolio: 'https://aditi-bandewar.netlify.app/'
    }
  ] as Developer[],

  contact: {
    /** PLACEHOLDER */
    email: 'info@ecochain.com',
    /** PLACEHOLDER - E.164 for the tel: link */
    phone: '+1 (123) 456-7890',
    phoneHref: '+11234567890',
    /** PLACEHOLDER */
    address: {
      line1: '123 Green Street',
      line2: 'Eco City, EC 12345',
      country: ''
    },
    /** Shown on the Contact page next to the clock icon */
    hours: 'Monday - Friday, 9:00 - 18:00'
  },

  /** Empty array hides the social row entirely. PLACEHOLDER urls */
  socials: [] as SocialLink[],

  /** Used on the About page "what we do" section - these are real product facts */
  pillars: [
    {
      title: 'Collect',
      body: 'Households and businesses schedule a pickup. Collectors run the route and log what was actually recovered.'
    },
    {
      title: 'Reward',
      body: 'Verified collections earn EcoTokens, so recycling pays the people doing it rather than disappearing into a bin.'
    },
    {
      title: 'Remake',
      body: 'Partner factories buy recovered material and turn it into new goods, with the chain of custody recorded end to end.'
    },
    {
      title: 'Resell',
      body: 'Those goods return to the marketplace, where EcoTokens can be spent - closing the loop.'
    }
  ]
};

export default siteInfo;
