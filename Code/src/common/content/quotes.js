/* quotes.js - the quotes as they ship with the site (the admin edits them:
   admin -> Quotes). They are their own thing, separate from the poems.

   The FIRST quote is the main one: it is always at the top of the Quotes
   page: the Quotes page opens on it. Words wrapped in *stars* are the key
   words, set large and gold.

   All of these are voiid's own lines, picked from his Quotes Manager
   collection. Lines there that turned out to be someone else's (philosophers,
   books, films, anime, songs, proverbs) were left out.

   Each quote:
     text    the quote, plain text
     author  who said it / where it is from - optional ("" shows as voiid)
     date    the day it was added, YYYY-MM-DD - optional ("" for the ones
             written in 2025 with no exact day; dates are not shown on the page)

   Arranged so quotes on the same theme follow one another. */

const QUOTES = [
  { text: "In the deepest depths of *pain,* Man finds *God.*", author: "", date: "2026-11-14" },
  { text: "Though you wander a *thousand* roads, you'll eventually find your way *back* to God.", author: "", date: "2026-11-14" },
  { text: "Perhaps the greatest test of *faith* is not enduring suffering, but refusing to become *cruel* because of it.", author: "", date: "" },
  { text: "I fear *sin,* not death. For death is the gate; sin is the *chain.*", author: "", date: "2025-11-19" },
  { text: "A man may lose his way a *thousand* times, yet never travel beyond the reach of God's *mercy.*", author: "", date: "" },
  { text: "Faith is not proven beneath clear *skies,* but when the heavens offer no *answer.*", author: "", date: "" },
  { text: "A man who seeks God only in *comfort* may never understand the purpose of his *suffering.*", author: "", date: "" },

  { text: "Destiny may give a man a *direction,* but only his *choices* determine how far he travels.", author: "", date: "" },
  { text: "Life without purpose is *easy.* That's why it feels *empty.*", author: "", date: "2025-11-14" },
  { text: "If it matters, *bleed* for it. If you won't, it never *mattered.*", author: "", date: "2025-11-14" },
  { text: "Put your *goals* first, not people or things, or you'll learn through *misery.*", author: "", date: "2026-11-19" },
  { text: "Your purpose must be stronger than your desire for *comfort,* or comfort will eventually become your *master.*", author: "", date: "" },

  { text: "No matter what you do, the ending never changes. Death will find you eventually. But until it does, the choice is yours: pursue *greatness* with ruthless, relentless obsession, or waste your life convincing yourself that nothing matters. The destination is the same for everyone. What separates you is what you *choose* to do before you get there.", author: "", date: "2026-11-19" },
  { text: "An *obsession* knows no limits; what seems impossible to others becomes *inevitable* to the one who refuses to let go.", author: "", date: "2026-11-19" },
  { text: "I *hate* anime from the depths of my soul, but take it away and I'm *done.*", author: "", date: "2026-11-19" },
  { text: "Obsession is the engine of *achievement* and the seed of *madness.*", author: "", date: "2026-03-18" },
  { text: "Power is a *fire* that warms only those who risk *burning* first.", author: "", date: "2025-12-12" },
  { text: "Ambition without *discipline* is nothing but a beautiful form of *self-deception.*", author: "", date: "" },
  { text: "A man who cannot govern his *desires* shall never govern an *empire.*", author: "", date: "" },
  { text: "The greatest rulers are not those who demand to be followed, but those worth *following* even in *ruin.*", author: "", date: "" },

  { text: "You fear *monsters.* They fear becoming *human.*", author: "", date: "2025-11-14" },
  { text: "Before they called me a *monster,* I was only what they *made.*", author: "", date: "2025-12-10" },
  { text: "When a child can't find home in light, he makes *darkness* home.", author: "", date: "2025-11-14" },
  { text: "What I became was born from my own *funeral.*", author: "", date: "2025-11-14" },
  { text: "Maybe I grew *older…* or maybe I simply *died.*", author: "", date: "2025-11-14" },
  { text: "They'll try to kill me with their words, not knowing I'm already a rotten *corpse.*\nAnd corpses can't die *twice.*", author: "", date: "2026-11-17" },

  { text: "Solitude is a ruthless *mirror;* it reflects everything society allows you to *hide.*", author: "", date: "" },
  { text: "Solitude births a *demon* or breaks a brittle *man.*", author: "", date: "2025-11-14" },
  { text: "Alone is *quiet,* but quiet isn't always *easy.*", author: "", date: "2026-02-18" },
  { text: "A man who cannot endure his own *company* will forever remain a *prisoner* of others.", author: "", date: "" },

  { text: "We don't hate love. We just refuse to *beg* for it.", author: "", date: "2026-02-18" },
  { text: "Do not chain what was born to *fly;* even love becomes a *prison* when it refuses to let go.", author: "", date: "" },
  { text: "It stayed with me in the *dark,* so I'll keep it in the *light.*", author: "", date: "2025-11-14" },
  { text: "Surround yourself with those who'd walk through *fire* with you, not the *warmth.*", author: "", date: "2026-05-22" },
  { text: "Brotherhood is not measured by the *years* spent together, but by what remains when there is nothing left to *gain.*", author: "", date: "" },
  { text: "Pay attention to *when* and *why* they come around, and you will go far in life.", author: "", date: "2026-11-17" },

  { text: "The dead don't haunt us. It's our *memory* that does.", author: "", date: "2025-11-14" },
  { text: "Nothing is *heavier* than a thought you forgot to *forget.*", author: "", date: "2025-11-14" },
  { text: "They said storms *pass* — but some stay *inside* you.", author: "", date: "2025-11-14" },
  { text: "Some storms break *trees.* Some break *people.*", author: "", date: "2025-11-14" },
  { text: "When you're too numb to cry, the *sky* does it for you.", author: "", date: "2025-11-14" },
  { text: "The rain stopped, but we never found our way *back.*", author: "", date: "2025-11-14" },
  { text: "The last stage of grief is acceptance — not peace, but *silence.*", author: "", date: "2025-11-14" },
  { text: "How long must winters be to turn all of my rage into *warmth?* For how long must I ferment my ancient grief to call it *grace?*", author: "", date: "2026-11-17" },

  { text: "Every human wears two skins: *silk* and *sin.*", author: "", date: "2025-11-14" },
  { text: "Man is the only animal that *loves* and *destroys* with equal passion.", author: "", date: "2026-03-28" },
  { text: "Greed begins when a man forgets that another life is as *precious* as his *own.*", author: "", date: "" },
  { text: "Reality is too heavy for some, so they borrow *illusions* and call it *happiness.*", author: "", date: "2026-02-18" },
  { text: "For every happiness you wish upon, nature demands equal *sorrow* elsewhere.", author: "", date: "2026-05-12" },
  { text: "Between yes and no lives *maybe,* where most of life happens.", author: "", date: "2026-02-14" },

  { text: "Humans are tragic *art,* rotting on the walls of *time.*", author: "", date: "2025-11-14" },
  { text: "Time *murders* all things, especially *hope.*", author: "", date: "2025-12-10" },
  { text: "Life's gift is *time;* its curse is taking it *back.*", author: "", date: "2025-11-14" },
];

export default QUOTES;
