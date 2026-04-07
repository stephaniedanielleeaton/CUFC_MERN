import { SmallHero } from '../components/common/SmallHero'
import { Accordion } from '../components/common/Accordion'
import { SquareButton } from '../components/common/SquareButton'
import { useNavigate } from 'react-router-dom'

const WEAPONS = [
  'Longsword',
  'Rapier',
  'Saber',
  'Dagger',
  'Arming sword & buckler',
  'Smallsword',
  'Staff',
]

const WHY_CHOOSE_US = [
  {
    number: 1,
    title: 'To Learn',
    content: "While our lessons don't require members to study advanced techniques directly from the manuscripts, there's so much to learn. You'll learn the historical context and purpose of various weapons and how they were used, and then practice applying that information through sparring.",
  },
  {
    number: 2,
    title: 'To Get Active (with Swords!)',
    content: "Several of our members have joined with little to no athletic background—just a desire to exercise and an interest in swords!",
  },
  {
    number: 3,
    title: 'To Make New Friends',
    content: "Columbus United Fencing Club strives to provide an inclusive environment for all who enter through our doors. This makes it relatively easy to find a group of friends who support you and your endeavors, in and outside of the school itself.",
  },
  {
    number: 4,
    title: 'To Have Fun',
    content: "Whether you want to compete in tournament events or translate what you've learned in training to choreography, you'll find there are no wrong ways to have fun at Columbus United Fencing Club.",
  },
]

const CLASS_OFFERINGS = [
  {
    title: 'Introduction to HEMA',
    description: "Start here—our beginner-friendly class covers essential footwork, guards, and striking mechanics.",
  },
  {
    title: 'Longsword Fundamentals',
    description: "A structured class for new fencers to build clean, confident technique with the longsword.",
  },
  {
    title: 'Longsword Fencing',
    description: "Expand your timing, structure, and tactical decision-making in longsword-based drills and sparring.",
  },
  {
    title: 'Military Saber',
    description: "Practice the elegant and explosive techniques of the military saber through historical drills.",
  },
  {
    title: 'Rapier and Dagger',
    description: "Develop fine control, fluid footwork, and coordination using dual Renaissance-era weapons.",
  },
  {
    title: 'Tournament Prep',
    description: "Train for competition through high-intensity sparring, feedback, and tactical refinement.",
  },
  {
    title: 'Other Weapons',
    description: "Join special-topic sessions covering sword and buckler, messer, and more from the HEMA arsenal.",
  },
  {
    title: 'Marginalized Gender Open Floor',
    description: "A welcoming, identity-affirming training space for women, trans men, non-binary, and intersex fencers.",
  },
]

const RESOURCE_LINKS = [
  {
    title: 'Recommended Gear List',
    url: 'https://docs.google.com/document/d/1Bd1PCaTYj1KCHhWPQaLrLd6tD2dKeKakOej86G-ncbQ/edit?tab=t.0',
  },
  {
    title: 'Purpleheart Armory (Equipment, discount code: CUFC)',
    url: 'https://www.woodenswords.com/',
  },
]

const PRICING_OPTIONS = [
  {
    title: 'Introduction to HEMA Course',
    price: '$110',
    description: 'Complete 4-week beginner course with provided equipment',
  },
  {
    title: 'Monthly Class Access',
    price: '$110/month',
    description: 'Unlimited access to all regular weekly classes and social events. Requires auto-pay.',
  },
  {
    title: 'Family Plan',
    price: '$110 + $65/member',
    description: 'First member $110/month, each additional family member $65/month. Requires auto-pay.',
  },
  {
    title: 'Drop-In Class',
    price: '$20',
    description: 'Single class access, perfect for trying out our programs. Must be paid online or in person on the day of class.',
  },
]

const ACCORDION_ITEMS = [
  {
    title: 'What is Historical European Martial Arts?',
    content: (
      <div className="space-y-4">
        <p>
          Historical European Martial Arts, or HEMA for short, are martial arts from European 
          countries that are no longer used in modern times.
        </p>
        <div>
          <h4 className="font-semibold text-navy mb-2">Weapon styles we study:</h4>
          <ul className="space-y-1">
            {WEAPONS.map((weapon) => (
              <li key={weapon} className="flex items-center gap-2">
                <span className="text-medium-pink">•</span>
                <span>{weapon}</span>
              </li>
            ))}
          </ul>
        </div>
        <p>
          Unlike live-action roleplaying (LARP), HEMA is based on surviving fencing instruction 
          manuals and manuscripts written in the late Middle Ages and Renaissance periods.
        </p>
        <p>
          Our coaches have studied the works of German fencing masters Johannes Liechtenauer and 
          Joachim Meyer and Italian master Fiore dei Liberi for over a decade and pass on the 
          knowledge of centuries-old traditions in every class.
        </p>
      </div>
    ),
  },
  {
    title: 'Why Choose Columbus United Fencing Club?',
    content: (
      <div className="space-y-6">
        {WHY_CHOOSE_US.map((item) => (
          <div key={item.title} className="flex gap-4">
            <span className="text-2xl font-bold text-navy">{item.number}.</span>
            <div>
              <h4 className="font-bold text-navy mb-1">{item.title}</h4>
              <p>{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Getting Started',
    content: (
      <div className="space-y-6">
        <p>
          If you&apos;re new to the art of historical fencing, we encourage you to start with one of 
          our four week fundamental classes. This class is designed for the complete beginner, and 
          will teach you HEMA fundamentals through a single weapon style. Over the course of 4 weeks, 
          you&apos;ll receive instruction in basic footwork, form, and technique. These basics will 
          prepare you to join any of our weapon offerings after the starting course.
        </p>

        <div>
          <h4 className="font-bold text-navy mb-3">Topics we cover in class:</h4>
          <ul className="space-y-2">
            {[
              'Basic footwork and stances',
              'Proper cutting, thrusting structure and blade alignment',
              'Accurately reading distance between you and your opponent',
              'Introduction to offensive and defensive techniques',
              'Application of techniques in sparring',
              'Reading your opponent and making tactical decisions',
              'Understanding and following safety protocols',
            ].map((topic) => (
              <li key={topic} className="flex items-start gap-2">
                <span className="text-medium-pink mt-1">•</span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-navy mb-2">What gear do I need?</h4>
          <p className="mb-2">
            Lender gear will be provided for you to participate in the whole session. Just wear 
            comfortable gym clothing and bring a water bottle. Please note, that we only have 
            fencing jackets up to size 2XL and some drills will be altered if we cannot provide 
            a comfortable fitting jacket.
          </p>
          <p>
            After the course is completed, you will still be able to borrow loaner gear. We find 
            that most fencers purchase their own equipment at a rate that allows us to have gear 
            available for every student that needs it. However, priority for gear goes to the 
            newest students.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-navy mb-2">What happens at the end?</h4>
          <p>
            At the end of four weeks, you will be sparring ready. You will be invited to join the 
            rest of our class offerings. Although the class will focus on a singular weapon form, 
            the basics you learn will allow you to join any of our other class offerings.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Regular Class Offerings',
    content: (
      <div className="space-y-4">
        <p>
          From beginner foundations to advanced sparring, our classes welcome fencers of all 
          skill levels. Explore historical weapons and refine your technique in a supportive environment.
        </p>
        <p className="italic text-gray-500">
          For current class times and registration, please see our schedule page.
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mt-4">
          {CLASS_OFFERINGS.map((offering) => (
            <div key={offering.title} className="border border-gray-200 p-4">
              <h4 className="font-bold text-navy mb-1">{offering.title}</h4>
              <p className="text-sm text-gray-600">{offering.description}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Pricing & Options',
    content: (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {PRICING_OPTIONS.map((option) => (
          <div key={option.title} className="border border-gray-200 p-5">
            <h4 className="font-bold text-navy text-lg mb-1">{option.title}</h4>
            <p className="text-2xl font-extrabold text-medium-pink mb-2">{option.price}</p>
            <p className="text-sm text-gray-600">{option.description}</p>
          </div>
        ))}
      </div>
    ),
  },
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-white">
      <SmallHero pageTitle="About" />
      
      {/* Hero Section */}
      <section className="bg-navy py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">
            Discover Historical European Martial Arts
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto">
            Join our community of historical fencing enthusiasts. Learn centuries-old 
            sword fighting techniques in a welcoming, inclusive environment.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 px-6 md:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Resources - Always Visible */}
          <div className="mb-12 px-2 md:px-0">
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Quick Links
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-navy mt-2 mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {RESOURCE_LINKS.map((resource) => (
                <li key={resource.title} className="flex items-center gap-2">
                  <span className="text-medium-pink">•</span>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy underline hover:text-medium-pink transition-colors text-base"
                  >
                    {resource.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Intro Text */}
          <div className="mb-12 px-2 md:px-0">
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Learn More
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-navy mt-2 mb-4">
              About Our Club
            </h3>
            <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
              Columbus United Fencing Club is dedicated to the study and practice of Historical 
              European Martial Arts (HEMA). We offer classes for all skill levels, from complete 
              beginners to experienced fencers looking to refine their technique.
            </p>
          </div>

          {/* Accordion */}
          <div className="px-2 md:px-0">
            <Accordion items={ACCORDION_ITEMS} />
          </div>

          {/* CTA */}
          <div className="mt-12 text-center px-2 md:px-0">
            <p className="text-gray-600 mb-4">Ready to start your journey?</p>
            <SquareButton
              onClick={() => navigate('/')}
              variant="white"
              style={{ minWidth: 180 }}
            >
              GET STARTED
            </SquareButton>
          </div>
        </div>
      </section>
    </div>
  )
}
