export interface GrammarExample {
  fr: string;
  en: string;
}

export interface GrammarEntry {
  rule: string;
  examples?: GrammarExample[];
  tip?: string;
  warning?: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  entries: GrammarEntry[];
}

export interface GrammarSection {
  id: string;
  title: string;
  icon: string;
  topics: GrammarTopic[];
}

export const grammarSections: GrammarSection[] = [
  {
    id: "nouns_articles",
    title: "Nouns & Articles",
    icon: "book-open",
    topics: [
      {
        id: "gender",
        title: "Noun Gender",
        entries: [
          {
            rule: "Every French noun is either masculine or feminine. There is no reliable rule \u2014 you must learn the gender with each noun. However, some patterns can help.",
            examples: [
              { fr: "le livre", en: "the book (masculine)" },
              { fr: "la table", en: "the table (feminine)" },
            ],
          },
          {
            rule: "Common masculine endings: -age, -ment, -eau, -eur, -isme, -ard, -et.",
            examples: [
              { fr: "le fromage", en: "the cheese" },
              { fr: "le gouvernement", en: "the government" },
              { fr: "le ch\u00e2teau", en: "the castle" },
            ],
          },
          {
            rule: "Common feminine endings: -tion, -sion, -ure, -ette, -ence, -ance, -ie, -\u00e9e.",
            examples: [
              { fr: "la nation", en: "the nation" },
              { fr: "la voiture", en: "the car" },
              { fr: "la diff\u00e9rence", en: "the difference" },
            ],
          },
          {
            rule: "Some nouns change meaning depending on gender.",
            examples: [
              { fr: "le livre / la livre", en: "the book / the pound" },
              { fr: "le tour / la tour", en: "the tour / the tower" },
              { fr: "le poste / la poste", en: "the position / the post office" },
            ],
          },
        ],
      },
      {
        id: "definite_articles",
        title: "Definite Articles (the)",
        entries: [
          {
            rule: "French has four forms of 'the': le (masculine singular), la (feminine singular), l' (before a vowel or silent h), les (all plurals).",
            examples: [
              { fr: "le chat", en: "the cat" },
              { fr: "la maison", en: "the house" },
              { fr: "l'\u00e9cole", en: "the school" },
              { fr: "les enfants", en: "the children" },
            ],
          },
          {
            rule: "Unlike English, French uses definite articles when speaking about things in general.",
            examples: [
              { fr: "J'aime le chocolat.", en: "I like chocolate. (lit. 'I like the chocolate')" },
              { fr: "Les chiens sont loyaux.", en: "Dogs are loyal." },
            ],
            tip: "If you'd say 'I like chocolate' in English (general sense), French requires 'le/la/les'.",
          },
        ],
      },
      {
        id: "indefinite_articles",
        title: "Indefinite Articles (a, an, some)",
        entries: [
          {
            rule: "un (masculine singular), une (feminine singular), des (plural \u2014 meaning 'some').",
            examples: [
              { fr: "un ami", en: "a friend (m)" },
              { fr: "une amie", en: "a friend (f)" },
              { fr: "des livres", en: "some books" },
            ],
          },
          {
            rule: "After a negation, un/une/des become de (or d' before a vowel).",
            examples: [
              { fr: "J'ai un chat. \u2192 Je n'ai pas de chat.", en: "I have a cat. \u2192 I don't have a cat." },
              { fr: "Il y a des pommes. \u2192 Il n'y a pas de pommes.", en: "There are apples. \u2192 There are no apples." },
            ],
          },
        ],
      },
      {
        id: "partitive_articles",
        title: "Partitive Articles (some, any)",
        entries: [
          {
            rule: "Use partitive articles for unspecified quantities of uncountable nouns: du (masculine), de la (feminine), de l' (before vowel/silent h), des (plural).",
            examples: [
              { fr: "Je veux du pain.", en: "I want (some) bread." },
              { fr: "Elle boit de la bi\u00e8re.", en: "She drinks (some) beer." },
              { fr: "Il mange de l'ananas.", en: "He eats (some) pineapple." },
            ],
          },
          {
            rule: "After negation, all partitive articles become de/d'.",
            examples: [
              { fr: "Je ne veux pas de pain.", en: "I don't want any bread." },
              { fr: "Il n'y a plus de lait.", en: "There is no more milk." },
            ],
          },
          {
            rule: "After expressions of quantity, use de (not du/de la/des).",
            examples: [
              { fr: "beaucoup de travail", en: "a lot of work" },
              { fr: "un peu de sucre", en: "a little sugar" },
              { fr: "trop de bruit", en: "too much noise" },
            ],
          },
        ],
      },
      {
        id: "plurals",
        title: "Forming Plurals",
        entries: [
          {
            rule: "Most nouns: add -s (the -s is silent in speech).",
            examples: [
              { fr: "le chat \u2192 les chats", en: "the cat \u2192 the cats" },
            ],
          },
          {
            rule: "Nouns ending in -eau, -au, -eu: add -x.",
            examples: [
              { fr: "le g\u00e2teau \u2192 les g\u00e2teaux", en: "the cake \u2192 the cakes" },
              { fr: "le jeu \u2192 les jeux", en: "the game \u2192 the games" },
            ],
          },
          {
            rule: "Nouns ending in -al: change to -aux.",
            examples: [
              { fr: "le journal \u2192 les journaux", en: "the newspaper \u2192 the newspapers" },
              { fr: "l'animal \u2192 les animaux", en: "the animal \u2192 the animals" },
            ],
          },
          {
            rule: "Nouns already ending in -s, -x, or -z: no change.",
            examples: [
              { fr: "le fils \u2192 les fils", en: "the son \u2192 the sons" },
              { fr: "la voix \u2192 les voix", en: "the voice \u2192 the voices" },
            ],
          },
          {
            rule: "Common irregular plurals.",
            examples: [
              { fr: "l'\u0153il \u2192 les yeux", en: "the eye \u2192 the eyes" },
              { fr: "monsieur \u2192 messieurs", en: "sir \u2192 sirs/gentlemen" },
              { fr: "madame \u2192 mesdames", en: "madam \u2192 madams/ladies" },
            ],
          },
        ],
      },
      {
        id: "contractions",
        title: "Contractions with \u00e0 and de",
        entries: [
          {
            rule: "\u00e0 + le = au, \u00e0 + les = aux. (\u00e0 + la and \u00e0 + l' do not contract.)",
            examples: [
              { fr: "Je vais au cin\u00e9ma.", en: "I'm going to the cinema." },
              { fr: "Elle parle aux \u00e9tudiants.", en: "She speaks to the students." },
              { fr: "Il pense \u00e0 la vie.", en: "He thinks about life. (no contraction)" },
            ],
          },
          {
            rule: "de + le = du, de + les = des. (de + la and de + l' do not contract.)",
            examples: [
              { fr: "le livre du professeur", en: "the teacher's book" },
              { fr: "la couleur des fleurs", en: "the color of the flowers" },
              { fr: "pr\u00e8s de la gare", en: "near the station (no contraction)" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "pronouns",
    title: "Pronouns",
    icon: "user",
    topics: [
      {
        id: "subject_pronouns",
        title: "Subject Pronouns",
        entries: [
          {
            rule: "The subject pronouns are: je (I), tu (you informal), il/elle/on (he/she/one), nous (we), vous (you formal or plural), ils/elles (they m/f).",
            examples: [
              { fr: "Je parle fran\u00e7ais.", en: "I speak French." },
              { fr: "Nous habitons \u00e0 Paris.", en: "We live in Paris." },
            ],
          },
          {
            rule: "'Tu' is informal (friends, family, children). 'Vous' is formal (strangers, elders, professional contexts) or plural (any group of people).",
            examples: [
              { fr: "Tu viens ce soir ?", en: "Are you coming tonight? (to a friend)" },
              { fr: "Vous \u00eates tr\u00e8s aimable.", en: "You are very kind. (formal)" },
            ],
            tip: "When in doubt, use 'vous'. The other person will invite you to use 'tu' if they prefer.",
          },
          {
            rule: "'On' literally means 'one' but is very commonly used to mean 'we' in everyday speech. It takes the same verb form as il/elle (3rd person singular).",
            examples: [
              { fr: "On va au cin\u00e9ma ?", en: "Shall we go to the cinema?" },
              { fr: "En France, on mange bien.", en: "In France, people eat well." },
            ],
          },
        ],
      },
      {
        id: "stressed_pronouns",
        title: "Stressed (Tonic) Pronouns",
        entries: [
          {
            rule: "Stressed pronouns are: moi, toi, lui, elle, nous, vous, eux, elles. They are used for emphasis, after prepositions, in comparisons, and in compound subjects.",
            examples: [
              { fr: "Moi, je suis fran\u00e7ais.", en: "Me, I am French. (emphasis)" },
              { fr: "C'est pour toi.", en: "It's for you." },
              { fr: "Elle est plus grande que lui.", en: "She is taller than him." },
              { fr: "Pierre et moi, nous aimons le jazz.", en: "Pierre and I, we love jazz." },
            ],
          },
          {
            rule: "After c'est / ce sont, use stressed pronouns.",
            examples: [
              { fr: "C'est moi.", en: "It's me." },
              { fr: "Ce sont eux.", en: "It's them." },
            ],
          },
        ],
      },
      {
        id: "direct_object_pronouns",
        title: "Direct Object Pronouns",
        entries: [
          {
            rule: "Direct object pronouns replace a noun that receives the action directly (no preposition). They are: me, te, le/la/l', nous, vous, les. They go before the verb.",
            examples: [
              { fr: "Je vois Marie. \u2192 Je la vois.", en: "I see Marie. \u2192 I see her." },
              { fr: "Tu lis le journal ? \u2192 Tu le lis ?", en: "Do you read the newspaper? \u2192 Do you read it?" },
              { fr: "Il nous regarde.", en: "He watches us." },
            ],
          },
          {
            rule: "In the pass\u00e9 compos\u00e9, the pronoun goes before the auxiliary (avoir/\u00eatre). When using avoir, the past participle agrees with a preceding direct object pronoun.",
            examples: [
              { fr: "Je l'ai vue.", en: "I saw her. (vue agrees with la \u2192 feminine)" },
              { fr: "Les fleurs ? Il les a achet\u00e9es.", en: "The flowers? He bought them. (achet\u00e9es agrees with les \u2192 feminine plural)" },
            ],
          },
        ],
      },
      {
        id: "indirect_object_pronouns",
        title: "Indirect Object Pronouns",
        entries: [
          {
            rule: "Indirect object pronouns replace a noun preceded by '\u00e0' (to/for someone). They are: me, te, lui, nous, vous, leur. They go before the verb.",
            examples: [
              { fr: "Je parle \u00e0 Marie. \u2192 Je lui parle.", en: "I speak to Marie. \u2192 I speak to her." },
              { fr: "Il donne le livre aux enfants. \u2192 Il leur donne le livre.", en: "He gives the book to the children. \u2192 He gives them the book." },
            ],
            tip: "lui = to him OR to her. leur = to them. Don't confuse 'leur' (pronoun, no -s) with 'leurs' (possessive adjective).",
          },
        ],
      },
      {
        id: "pronoun_y",
        title: "The Pronoun 'y'",
        entries: [
          {
            rule: "'Y' replaces a place or a phrase introduced by '\u00e0' (when not referring to a person). It goes before the verb.",
            examples: [
              { fr: "Tu vas \u00e0 Paris ? \u2014 Oui, j'y vais.", en: "Are you going to Paris? \u2014 Yes, I'm going there." },
              { fr: "Elle pense \u00e0 son examen. \u2192 Elle y pense.", en: "She thinks about her exam. \u2192 She thinks about it." },
            ],
          },
          {
            rule: "'Il y a' is a fixed expression meaning 'there is' or 'there are'.",
            examples: [
              { fr: "Il y a un chat sur la table.", en: "There is a cat on the table." },
              { fr: "Il n'y a pas de probl\u00e8me.", en: "There is no problem." },
            ],
          },
        ],
      },
      {
        id: "pronoun_en",
        title: "The Pronoun 'en'",
        entries: [
          {
            rule: "'En' replaces a noun introduced by 'de', a partitive article (du, de la, des), or a quantity expression. It goes before the verb.",
            examples: [
              { fr: "Tu veux du caf\u00e9 ? \u2014 Oui, j'en veux.", en: "Do you want coffee? \u2014 Yes, I want some." },
              { fr: "Elle a trois s\u0153urs. \u2192 Elle en a trois.", en: "She has three sisters. \u2192 She has three (of them)." },
              { fr: "Il revient de Lyon. \u2192 Il en revient.", en: "He's coming back from Lyon. \u2192 He's coming back from there." },
            ],
            tip: "With quantities, keep the number but replace the noun with 'en': J'ai deux chats \u2192 J'en ai deux.",
          },
        ],
      },
      {
        id: "pronoun_order",
        title: "Pronoun Order",
        entries: [
          {
            rule: "When using multiple pronouns before a verb, they follow a fixed order: me/te/se/nous/vous \u2192 le/la/les \u2192 lui/leur \u2192 y \u2192 en \u2192 verb.",
            examples: [
              { fr: "Il me le donne.", en: "He gives it to me." },
              { fr: "Elle le lui a dit.", en: "She told it to him/her." },
              { fr: "Je vous en parlerai.", en: "I will talk to you about it." },
            ],
          },
        ],
      },
      {
        id: "relative_pronouns",
        title: "Relative Pronouns",
        entries: [
          {
            rule: "'Qui' = who/which/that \u2014 used as the subject of the relative clause.",
            examples: [
              { fr: "L'homme qui parle est mon p\u00e8re.", en: "The man who is speaking is my father." },
              { fr: "Le film qui passe ce soir est bon.", en: "The film that is showing tonight is good." },
            ],
          },
          {
            rule: "'Que' (qu') = whom/which/that \u2014 used as the direct object of the relative clause.",
            examples: [
              { fr: "Le livre que je lis est int\u00e9ressant.", en: "The book (that) I'm reading is interesting." },
              { fr: "La femme qu'il aime est partie.", en: "The woman (whom) he loves has left." },
            ],
            tip: "In English you can often drop 'that/whom'. In French, 'que' is never optional.",
          },
          {
            rule: "'O\u00f9' = where/when \u2014 used for place or time.",
            examples: [
              { fr: "La ville o\u00f9 j'habite est petite.", en: "The city where I live is small." },
              { fr: "Le jour o\u00f9 il est arriv\u00e9\u2026", en: "The day (when) he arrived\u2026" },
            ],
          },
          {
            rule: "'Dont' = whose/of which/about which \u2014 replaces de + noun.",
            examples: [
              { fr: "L'homme dont je parle est ici.", en: "The man I'm talking about is here." },
              { fr: "Le film dont tu as besoin.", en: "The film (that) you need. (avoir besoin de)" },
            ],
          },
        ],
      },
      {
        id: "demonstrative_pronouns",
        title: "Demonstrative Pronouns",
        entries: [
          {
            rule: "celui (m.sg), celle (f.sg), ceux (m.pl), celles (f.pl) \u2014 mean 'the one(s)'. Often followed by -ci/-l\u00e0, de, or qui/que.",
            examples: [
              { fr: "Quel g\u00e2teau ? Celui-ci ou celui-l\u00e0 ?", en: "Which cake? This one or that one?" },
              { fr: "Ma voiture et celle de Marie.", en: "My car and Marie's (the one of Marie)." },
            ],
          },
          {
            rule: "'Ce', 'ceci', 'cela' (shortened to '\u00e7a') refer to ideas or unspecified things.",
            examples: [
              { fr: "\u00c7a m'int\u00e9resse.", en: "That interests me." },
              { fr: "C'est vrai.", en: "That's true." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "verbs_present",
    title: "Verbs: Present Tense",
    icon: "zap",
    topics: [
      {
        id: "er_verbs",
        title: "-er Verbs (Regular)",
        entries: [
          {
            rule: "About 80% of French verbs end in -er. Drop the -er and add: -e, -es, -e, -ons, -ez, -ent.",
            examples: [
              { fr: "parler \u2192 je parle, tu parles, il/elle parle, nous parlons, vous parlez, ils/elles parlent", en: "to speak" },
              { fr: "Je travaille \u00e0 Paris.", en: "I work in Paris." },
            ],
            tip: "je/tu/il/ils forms all sound the same: [parl]. Only nous and vous sound different.",
          },
        ],
      },
      {
        id: "ir_verbs",
        title: "-ir Verbs (Regular)",
        entries: [
          {
            rule: "Regular -ir verbs (like finir): drop -ir, add -is, -is, -it, -issons, -issez, -issent.",
            examples: [
              { fr: "finir \u2192 je finis, tu finis, il finit, nous finissons, vous finissez, ils finissent", en: "to finish" },
              { fr: "Le film finit \u00e0 22 h.", en: "The film ends at 10 PM." },
            ],
            tip: "Not all -ir verbs follow this pattern. Verbs like partir, dormir, sortir are irregular.",
          },
        ],
      },
      {
        id: "re_verbs",
        title: "-re Verbs (Regular)",
        entries: [
          {
            rule: "Regular -re verbs (like vendre): drop -re, add -s, -s, \u2013 (nothing), -ons, -ez, -ent.",
            examples: [
              { fr: "vendre \u2192 je vends, tu vends, il vend, nous vendons, vous vendez, ils vendent", en: "to sell" },
              { fr: "Elle attend le bus.", en: "She waits for the bus." },
            ],
          },
        ],
      },
      {
        id: "key_irregular_verbs",
        title: "Key Irregular Verbs",
        entries: [
          {
            rule: "\u00eatre (to be): suis, es, est, sommes, \u00eates, sont.",
            examples: [
              { fr: "Je suis fatigu\u00e9(e).", en: "I am tired." },
              { fr: "Nous sommes pr\u00eats.", en: "We are ready." },
            ],
          },
          {
            rule: "avoir (to have): ai, as, a, avons, avez, ont.",
            examples: [
              { fr: "J'ai vingt ans.", en: "I am twenty years old. (lit. 'I have twenty years')" },
              { fr: "Ils ont faim.", en: "They are hungry. (lit. 'They have hunger')" },
            ],
          },
          {
            rule: "aller (to go): vais, vas, va, allons, allez, vont.",
            examples: [
              { fr: "Je vais bien.", en: "I'm doing well." },
              { fr: "Nous allons au march\u00e9.", en: "We're going to the market." },
            ],
          },
          {
            rule: "faire (to do/make): fais, fais, fait, faisons, faites, font.",
            examples: [
              { fr: "Qu'est-ce que tu fais ?", en: "What are you doing?" },
              { fr: "Il fait beau.", en: "The weather is nice." },
            ],
          },
          {
            rule: "pouvoir (can): peux, peux, peut, pouvons, pouvez, peuvent.",
            examples: [
              { fr: "Je peux vous aider.", en: "I can help you." },
            ],
          },
          {
            rule: "vouloir (to want): veux, veux, veut, voulons, voulez, veulent.",
            examples: [
              { fr: "Je voudrais un caf\u00e9.", en: "I would like a coffee. (conditional \u2014 polite form)" },
            ],
          },
          {
            rule: "devoir (must/to have to): dois, dois, doit, devons, devez, doivent.",
            examples: [
              { fr: "Tu dois partir.", en: "You must leave." },
            ],
          },
          {
            rule: "savoir (to know a fact/how to) vs. conna\u00eetre (to know/be familiar with a person, place, thing).",
            examples: [
              { fr: "Je sais nager.", en: "I know how to swim." },
              { fr: "Tu connais Marie ?", en: "Do you know Marie?" },
            ],
          },
          {
            rule: "prendre (to take): prends, prends, prend, prenons, prenez, prennent. Apprendre and comprendre follow the same pattern.",
            examples: [
              { fr: "Je prends le m\u00e9tro.", en: "I take the metro." },
              { fr: "Ils comprennent le probl\u00e8me.", en: "They understand the problem." },
            ],
          },
        ],
      },
      {
        id: "reflexive_verbs",
        title: "Reflexive Verbs",
        entries: [
          {
            rule: "Reflexive verbs use a reflexive pronoun (me, te, se, nous, vous, se) before the verb. They indicate that the subject performs the action on itself.",
            examples: [
              { fr: "Je me l\u00e8ve \u00e0 7 h.", en: "I get up at 7 AM." },
              { fr: "Elle se couche tard.", en: "She goes to bed late." },
              { fr: "Nous nous amusons.", en: "We're having fun." },
            ],
          },
          {
            rule: "Many daily routine verbs are reflexive in French but not in English.",
            examples: [
              { fr: "se laver \u2014 to wash (oneself)", en: "" },
              { fr: "s'habiller \u2014 to get dressed", en: "" },
              { fr: "se r\u00e9veiller \u2014 to wake up", en: "" },
              { fr: "se promener \u2014 to go for a walk", en: "" },
              { fr: "se souvenir de \u2014 to remember", en: "" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "verbs_past",
    title: "Verbs: Past Tenses",
    icon: "clock",
    topics: [
      {
        id: "passe_compose",
        title: "Pass\u00e9 Compos\u00e9 (Completed Past)",
        entries: [
          {
            rule: "The pass\u00e9 compos\u00e9 describes completed actions in the past. It is formed with a helper verb (avoir or \u00eatre) in the present + past participle.",
            examples: [
              { fr: "J'ai mang\u00e9 une pomme.", en: "I ate an apple." },
              { fr: "Elle a fini son travail.", en: "She finished her work." },
            ],
          },
          {
            rule: "Regular past participles: -er \u2192 -\u00e9, -ir \u2192 -i, -re \u2192 -u.",
            examples: [
              { fr: "parler \u2192 parl\u00e9, finir \u2192 fini, vendre \u2192 vendu", en: "" },
            ],
          },
          {
            rule: "Common irregular past participles you must memorize.",
            examples: [
              { fr: "avoir \u2192 eu, \u00eatre \u2192 \u00e9t\u00e9, faire \u2192 fait, prendre \u2192 pris", en: "" },
              { fr: "voir \u2192 vu, lire \u2192 lu, \u00e9crire \u2192 \u00e9crit, dire \u2192 dit", en: "" },
              { fr: "mettre \u2192 mis, ouvrir \u2192 ouvert, pouvoir \u2192 pu, vouloir \u2192 voulu", en: "" },
              { fr: "savoir \u2192 su, devoir \u2192 d\u00fb, boire \u2192 bu, conna\u00eetre \u2192 connu", en: "" },
            ],
          },
          {
            rule: "Some verbs use \u00eatre instead of avoir. These are mostly verbs of motion or state change. A common mnemonic is 'DR MRS VANDERTRAMP': Devenir, Revenir, Monter, Rester, Sortir, Venir, Aller, Na\u00eetre, Descendre, Entrer, Rentrer, Tomber, Retourner, Arriver, Mourir, Partir.",
            examples: [
              { fr: "Je suis all\u00e9(e) au cin\u00e9ma.", en: "I went to the cinema." },
              { fr: "Elle est n\u00e9e en 1990.", en: "She was born in 1990." },
              { fr: "Ils sont partis hier.", en: "They left yesterday." },
            ],
          },
          {
            rule: "With \u00eatre, the past participle agrees in gender and number with the subject.",
            examples: [
              { fr: "Elle est partie. (feminine \u2192 -e)", en: "She left." },
              { fr: "Elles sont arriv\u00e9es. (feminine plural \u2192 -\u00e9es)", en: "They arrived." },
              { fr: "Il est tomb\u00e9.", en: "He fell. (no extra agreement)" },
            ],
          },
          {
            rule: "All reflexive verbs use \u00eatre in the pass\u00e9 compos\u00e9.",
            examples: [
              { fr: "Je me suis lev\u00e9(e) t\u00f4t.", en: "I got up early." },
              { fr: "Elles se sont promen\u00e9es.", en: "They went for a walk." },
            ],
          },
        ],
      },
      {
        id: "imparfait",
        title: "Imparfait (Imperfect \u2014 Ongoing/Habitual Past)",
        entries: [
          {
            rule: "The imparfait describes ongoing states, habitual actions, or background descriptions in the past. Take the nous form of the present tense, drop -ons, add: -ais, -ais, -ait, -ions, -iez, -aient.",
            examples: [
              { fr: "nous parlons \u2192 je parlais", en: "I was speaking / I used to speak" },
              { fr: "Quand j'\u00e9tais petit, je jouais dehors.", en: "When I was little, I used to play outside." },
              { fr: "Il faisait beau.", en: "The weather was nice." },
            ],
          },
          {
            rule: "The only verb with an irregular imparfait stem is \u00eatre \u2192 \u00e9t-.",
            examples: [
              { fr: "j'\u00e9tais, tu \u00e9tais, il \u00e9tait, nous \u00e9tions, vous \u00e9tiez, ils \u00e9taient", en: "" },
            ],
          },
        ],
      },
      {
        id: "pc_vs_imparfait",
        title: "Pass\u00e9 Compos\u00e9 vs. Imparfait",
        entries: [
          {
            rule: "Pass\u00e9 compos\u00e9 = specific, completed action. Imparfait = background, description, habit, or ongoing action.",
            examples: [
              { fr: "Je lisais quand il est arriv\u00e9.", en: "I was reading (ongoing) when he arrived (completed event)." },
              { fr: "Avant, je prenais le bus. Hier, j'ai pris le m\u00e9tro.", en: "Before, I used to take (habit) the bus. Yesterday, I took (single event) the metro." },
            ],
            tip: "Think of the imparfait as the background of a movie scene and the pass\u00e9 compos\u00e9 as the events that happen in that scene.",
          },
        ],
      },
      {
        id: "plus_que_parfait",
        title: "Plus-que-parfait (Pluperfect)",
        entries: [
          {
            rule: "The plus-que-parfait describes an action that happened before another past action. It is formed with the auxiliary (avoir or \u00eatre) in the imparfait + past participle.",
            examples: [
              { fr: "J'avais d\u00e9j\u00e0 mang\u00e9 quand il est arriv\u00e9.", en: "I had already eaten when he arrived." },
              { fr: "Elle \u00e9tait partie avant nous.", en: "She had left before us." },
            ],
          },
          {
            rule: "Uses the same auxiliary (avoir or \u00eatre) and past participle as the pass\u00e9 compos\u00e9. Only the auxiliary changes to the imparfait.",
            examples: [
              { fr: "avoir \u2192 j'avais parl\u00e9 (I had spoken)", en: "" },
              { fr: "\u00eatre \u2192 j'\u00e9tais all\u00e9(e) (I had gone)", en: "" },
            ],
            tip: "Think of it as 'the past of the past' \u2014 it sets the scene for events that happened even earlier than another past event.",
          },
        ],
      },
      {
        id: "passe_simple",
        title: "Pass\u00e9 Simple (Literary Past)",
        entries: [
          {
            rule: "The pass\u00e9 simple is used in formal writing and literature to describe completed past actions. Regular -er verbs: -ai, -as, -a, -\u00e2mes, -\u00e2tes, -\u00e8rent.",
            examples: [
              { fr: "parler \u2192 je parlai, tu parlas, il parla, nous parl\u00e2mes, vous parl\u00e2tes, ils parl\u00e8rent", en: "" },
            ],
          },
          {
            rule: "Regular -ir and -re verbs: -is, -is, -it, -\u00eemes, -\u00eetes, -irent.",
            examples: [
              { fr: "finir \u2192 je finis, tu finis, il finit, nous fin\u00eemes, vous fin\u00eetes, ils finirent", en: "" },
              { fr: "rendre \u2192 je rendis, tu rendis, il rendit, nous rend\u00eemes, vous rend\u00eetes, ils rendirent", en: "" },
            ],
          },
          {
            rule: "Common irregular pass\u00e9 simple forms.",
            examples: [
              { fr: "\u00eatre \u2192 je fus, tu fus, il fut, nous f\u00fbmes, vous f\u00fbtes, ils furent", en: "" },
              { fr: "avoir \u2192 j'eus, tu eus, il eut, nous e\u00fbmes, vous e\u00fbtes, ils eurent", en: "" },
              { fr: "faire \u2192 je fis, voir \u2192 je vis, prendre \u2192 je pris, venir \u2192 je vins", en: "" },
            ],
            tip: "The pass\u00e9 simple is almost never used in spoken French. You will encounter it mainly in novels, historical texts, and formal writing. For everyday speech, use the pass\u00e9 compos\u00e9 instead.",
          },
        ],
      },
      {
        id: "recent_past",
        title: "Recent Past (venir de)",
        entries: [
          {
            rule: "Use 'venir de + infinitive' to express something that just happened.",
            examples: [
              { fr: "Je viens de manger.", en: "I just ate." },
              { fr: "Elle vient d'arriver.", en: "She just arrived." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "verbs_future_conditional",
    title: "Verbs: Future & Conditional",
    icon: "arrow-right",
    topics: [
      {
        id: "near_future",
        title: "Near Future (aller + infinitive)",
        entries: [
          {
            rule: "The most common way to express the future in spoken French: conjugated aller + infinitive.",
            examples: [
              { fr: "Je vais manger.", en: "I'm going to eat." },
              { fr: "Nous allons partir demain.", en: "We're going to leave tomorrow." },
              { fr: "Il va pleuvoir.", en: "It's going to rain." },
            ],
          },
        ],
      },
      {
        id: "futur_simple",
        title: "Future Simple",
        entries: [
          {
            rule: "For regular verbs, add these endings to the whole infinitive (-re verbs drop the final -e): -ai, -as, -a, -ons, -ez, -ont.",
            examples: [
              { fr: "parler \u2192 je parlerai, tu parleras, il parlera\u2026", en: "I will speak\u2026" },
              { fr: "finir \u2192 je finirai", en: "I will finish" },
              { fr: "vendre \u2192 je vendrai", en: "I will sell" },
            ],
          },
          {
            rule: "Common irregular future stems (the endings stay the same).",
            examples: [
              { fr: "\u00eatre \u2192 ser- (je serai), avoir \u2192 aur- (j'aurai)", en: "" },
              { fr: "aller \u2192 ir- (j'irai), faire \u2192 fer- (je ferai)", en: "" },
              { fr: "pouvoir \u2192 pourr- (je pourrai), vouloir \u2192 voudr-", en: "" },
              { fr: "devoir \u2192 devr-, savoir \u2192 saur-, venir \u2192 viendr-", en: "" },
              { fr: "voir \u2192 verr-, envoyer \u2192 enverr-", en: "" },
            ],
          },
        ],
      },
      {
        id: "conditional",
        title: "Conditional",
        entries: [
          {
            rule: "The conditional uses the same stem as the future simple but with imparfait endings: -ais, -ais, -ait, -ions, -iez, -aient.",
            examples: [
              { fr: "parler \u2192 je parlerais", en: "I would speak" },
              { fr: "\u00eatre \u2192 je serais", en: "I would be" },
              { fr: "avoir \u2192 j'aurais", en: "I would have" },
            ],
          },
          {
            rule: "Use the conditional for polite requests, wishes, hypotheticals, and suggestions.",
            examples: [
              { fr: "Je voudrais un croissant.", en: "I would like a croissant." },
              { fr: "Pourriez-vous m'aider ?", en: "Could you help me?" },
              { fr: "\u00c0 ta place, je partirais.", en: "In your place, I would leave." },
            ],
          },
          {
            rule: "For 'if' clauses (hypothetical): si + imparfait \u2192 conditional.",
            examples: [
              { fr: "Si j'avais de l'argent, je voyagerais.", en: "If I had money, I would travel." },
              { fr: "Si tu venais, on s'amuserait.", en: "If you came, we would have fun." },
            ],
            tip: "Never use the conditional or future tense after 'si' in a conditional sentence.",
          },
        ],
      },
      {
        id: "conditionnel_passe",
        title: "Conditionnel Pass\u00e9 (Past Conditional)",
        entries: [
          {
            rule: "The conditionnel pass\u00e9 expresses what would have happened. It is formed with the auxiliary (avoir or \u00eatre) in the conditionnel + past participle.",
            examples: [
              { fr: "J'aurais aim\u00e9 venir.", en: "I would have liked to come." },
              { fr: "Elle serait partie plus t\u00f4t.", en: "She would have left earlier." },
            ],
          },
          {
            rule: "Used for regrets, reproaches, and unrealized hypothetical situations in the past.",
            examples: [
              { fr: "J'aurais d\u00fb \u00e9tudier.", en: "I should have studied." },
              { fr: "Tu aurais pu m'aider.", en: "You could have helped me." },
            ],
          },
          {
            rule: "In 'if' clauses about the past: si + plus-que-parfait \u2192 conditionnel pass\u00e9.",
            examples: [
              { fr: "Si j'avais su, j'aurais agi diff\u00e9remment.", en: "If I had known, I would have acted differently." },
              { fr: "Si elle \u00e9tait venue, nous aurions \u00e9t\u00e9 contents.", en: "If she had come, we would have been happy." },
            ],
            tip: "Like with the present conditional, never use the conditionnel pass\u00e9 after 'si' \u2014 only in the result clause.",
          },
        ],
      },
    ],
  },
  {
    id: "verbs_other",
    title: "Verbs: Other Moods & Forms",
    icon: "layers",
    topics: [
      {
        id: "imperative",
        title: "Imperative (Commands)",
        entries: [
          {
            rule: "The imperative uses three forms: tu, nous, vous \u2014 without the subject pronoun. For -er verbs, the tu form drops the final -s.",
            examples: [
              { fr: "Parle ! (tu), Parlons ! (nous), Parlez ! (vous)", en: "Speak! Let's speak! Speak! (formal/plural)" },
              { fr: "Finis ton repas !", en: "Finish your meal!" },
              { fr: "Allons-y !", en: "Let's go!" },
            ],
          },
          {
            rule: "Irregular imperatives: \u00eatre \u2192 sois, soyons, soyez. avoir \u2192 aie, ayons, ayez. savoir \u2192 sache, sachons, sachez.",
            examples: [
              { fr: "Sois sage !", en: "Be good!" },
              { fr: "N'ayez pas peur.", en: "Don't be afraid." },
            ],
          },
          {
            rule: "For negative commands, place ne\u2026pas around the verb: Ne parle pas !",
            examples: [
              { fr: "Ne touche pas !", en: "Don't touch!" },
              { fr: "N'oubliez pas vos cl\u00e9s.", en: "Don't forget your keys." },
            ],
          },
        ],
      },
      {
        id: "subjunctive_basics",
        title: "Subjunctive (Basics)",
        entries: [
          {
            rule: "The subjunctive is used after certain expressions of necessity, emotion, doubt, or desire. It almost always appears after 'que'. For regular verbs, take the ils/elles present tense stem and add: -e, -es, -e, -ions, -iez, -ent.",
            examples: [
              { fr: "Il faut que tu parles.", en: "You must speak." },
              { fr: "Je veux que tu viennes.", en: "I want you to come." },
              { fr: "Il est important que nous comprenions.", en: "It's important that we understand." },
            ],
          },
          {
            rule: "Common triggers for the subjunctive.",
            examples: [
              { fr: "il faut que\u2026 \u2014 it is necessary that", en: "" },
              { fr: "je veux que\u2026 \u2014 I want that", en: "" },
              { fr: "je suis content(e) que\u2026 \u2014 I am happy that", en: "" },
              { fr: "il est possible que\u2026 \u2014 it is possible that", en: "" },
              { fr: "avant que\u2026 \u2014 before", en: "" },
              { fr: "pour que\u2026 \u2014 so that", en: "" },
              { fr: "bien que\u2026 \u2014 although", en: "" },
            ],
          },
          {
            rule: "\u00catre and avoir have irregular subjunctive forms. \u00eatre: sois, sois, soit, soyons, soyez, soient. avoir: aie, aies, ait, ayons, ayez, aient.",
            examples: [
              { fr: "Il faut que tu sois patient.", en: "You must be patient." },
              { fr: "Je doute qu'il ait raison.", en: "I doubt he is right." },
            ],
          },
        ],
      },
      {
        id: "infinitive_constructions",
        title: "Infinitive Constructions",
        entries: [
          {
            rule: "Many verbs are followed directly by an infinitive (no preposition).",
            examples: [
              { fr: "Je veux partir. (vouloir + inf.)", en: "I want to leave." },
              { fr: "Il sait nager. (savoir + inf.)", en: "He knows how to swim." },
              { fr: "Others: pouvoir, devoir, aimer, pr\u00e9f\u00e9rer, d\u00e9tester, esp\u00e9rer, aller", en: "" },
            ],
          },
          {
            rule: "Some verbs require 'de' before an infinitive.",
            examples: [
              { fr: "J'essaie de comprendre. (essayer de)", en: "I'm trying to understand." },
              { fr: "Il a d\u00e9cid\u00e9 de partir. (d\u00e9cider de)", en: "He decided to leave." },
              { fr: "Others: oublier de, refuser de, finir de, arr\u00eater de, avoir peur de", en: "" },
            ],
          },
          {
            rule: "Some verbs require '\u00e0' before an infinitive.",
            examples: [
              { fr: "J'apprends \u00e0 cuisiner. (apprendre \u00e0)", en: "I'm learning to cook." },
              { fr: "Elle commence \u00e0 comprendre. (commencer \u00e0)", en: "She's starting to understand." },
              { fr: "Others: aider \u00e0, r\u00e9ussir \u00e0, h\u00e9siter \u00e0, s'habituer \u00e0, inviter \u00e0", en: "" },
            ],
            tip: "There is no rule for which preposition a verb takes \u2014 you need to learn them. Dictionaries will list: 'essayer de faire qqch', 'apprendre \u00e0 faire qqch'.",
          },
        ],
      },
      {
        id: "passive_voice",
        title: "Passive Voice",
        entries: [
          {
            rule: "Formed with \u00eatre + past participle. The past participle agrees with the subject. The agent (doer) is introduced by 'par'.",
            examples: [
              { fr: "Le livre est lu par les \u00e9tudiants.", en: "The book is read by the students." },
              { fr: "La maison a \u00e9t\u00e9 construite en 1900.", en: "The house was built in 1900." },
            ],
            tip: "French often avoids the passive by using 'on': On parle fran\u00e7ais ici. (French is spoken here.)",
          },
        ],
      },
    ],
  },
  {
    id: "adjectives",
    title: "Adjectives",
    icon: "palette",
    topics: [
      {
        id: "adjective_agreement",
        title: "Agreement",
        entries: [
          {
            rule: "Adjectives must agree in gender and number with the noun they describe. General rules: add -e for feminine, -s for plural, -es for feminine plural.",
            examples: [
              { fr: "un grand homme / une grande femme", en: "a tall man / a tall woman" },
              { fr: "des grands arbres / des grandes maisons", en: "tall trees / big houses" },
            ],
          },
          {
            rule: "Adjectives already ending in -e don't change in the feminine. Adjectives already ending in -s or -x don't change in the masculine plural.",
            examples: [
              { fr: "un homme triste / une femme triste", en: "a sad man / a sad woman" },
              { fr: "un gros chat / de gros chats", en: "a big cat / big cats" },
            ],
          },
          {
            rule: "Some adjectives have special feminine forms.",
            examples: [
              { fr: "-eux \u2192 -euse : heureux / heureuse", en: "happy" },
              { fr: "-if \u2192 -ive : actif / active", en: "active" },
              { fr: "-er \u2192 -\u00e8re : premier / premi\u00e8re", en: "first" },
              { fr: "-on \u2192 -onne : bon / bonne", en: "good" },
              { fr: "-el \u2192 -elle : naturel / naturelle", en: "natural" },
            ],
          },
          {
            rule: "Irregular adjectives with distinct masculine/feminine forms.",
            examples: [
              { fr: "beau / belle (beautiful), nouveau / nouvelle (new), vieux / vieille (old)", en: "" },
              { fr: "blanc / blanche (white), long / longue (long), fou / folle (crazy)", en: "" },
            ],
          },
          {
            rule: "beau, nouveau, vieux have a special form before a masculine noun starting with a vowel or silent h: bel, nouvel, vieil.",
            examples: [
              { fr: "un bel homme", en: "a handsome man" },
              { fr: "un nouvel ami", en: "a new friend" },
              { fr: "un vieil arbre", en: "an old tree" },
            ],
          },
        ],
      },
      {
        id: "adjective_placement",
        title: "Placement",
        entries: [
          {
            rule: "Most adjectives come after the noun in French (the opposite of English).",
            examples: [
              { fr: "un livre int\u00e9ressant", en: "an interesting book" },
              { fr: "une chemise bleue", en: "a blue shirt" },
            ],
          },
          {
            rule: "A small group of common adjectives come before the noun. Remember BANGS: Beauty, Age, Number, Goodness, Size.",
            examples: [
              { fr: "une belle maison (beauty)", en: "a beautiful house" },
              { fr: "un vieux pont (age)", en: "an old bridge" },
              { fr: "le premier jour (number)", en: "the first day" },
              { fr: "un bon repas (goodness)", en: "a good meal" },
              { fr: "un petit chat (size)", en: "a small cat" },
            ],
          },
          {
            rule: "Some adjectives change meaning depending on whether they are placed before or after the noun.",
            examples: [
              { fr: "un ancien coll\u00e8gue / un b\u00e2timent ancien", en: "a former colleague / an old (ancient) building" },
              { fr: "mon propre lit / un lit propre", en: "my own bed / a clean bed" },
              { fr: "un grand homme / un homme grand", en: "a great man / a tall man" },
              { fr: "un cher ami / un livre cher", en: "a dear friend / an expensive book" },
            ],
          },
        ],
      },
      {
        id: "comparisons",
        title: "Comparisons & Superlatives",
        entries: [
          {
            rule: "Comparative: plus + adj + que (more \u2026 than), moins + adj + que (less \u2026 than), aussi + adj + que (as \u2026 as).",
            examples: [
              { fr: "Paris est plus grand que Lyon.", en: "Paris is bigger than Lyon." },
              { fr: "Ce film est moins int\u00e9ressant que l'autre.", en: "This film is less interesting than the other one." },
              { fr: "Elle est aussi intelligente que lui.", en: "She is as intelligent as him." },
            ],
          },
          {
            rule: "Superlative: le/la/les plus + adj (the most), le/la/les moins + adj (the least).",
            examples: [
              { fr: "C'est la plus grande ville.", en: "It's the biggest city." },
              { fr: "Le film le moins cher.", en: "The cheapest film." },
            ],
          },
          {
            rule: "Irregular comparatives: bon \u2192 meilleur (better), mauvais \u2192 pire (worse), bien \u2192 mieux (better \u2014 for adverbs).",
            examples: [
              { fr: "Ce g\u00e2teau est meilleur que l'autre.", en: "This cake is better than the other one." },
              { fr: "Elle parle mieux que moi.", en: "She speaks better than me." },
            ],
            tip: "meilleur(e) is an adjective (describes a noun). mieux is an adverb (describes how something is done).",
          },
        ],
      },
      {
        id: "possessive_adjectives",
        title: "Possessive Adjectives",
        entries: [
          {
            rule: "Possessive adjectives agree with the thing possessed (not the owner): mon/ma/mes (my), ton/ta/tes (your), son/sa/ses (his/her/its), notre/nos (our), votre/vos (your formal/plural), leur/leurs (their).",
            examples: [
              { fr: "mon livre (m), ma voiture (f), mes amis (pl)", en: "my book, my car, my friends" },
              { fr: "son p\u00e8re, sa m\u00e8re, ses enfants", en: "his/her father, his/her mother, his/her children" },
            ],
            tip: "Before a feminine noun starting with a vowel or silent h, use mon/ton/son instead of ma/ta/sa: mon amie (my friend, f).",
          },
        ],
      },
      {
        id: "demonstrative_adjectives",
        title: "Demonstrative Adjectives (this/that)",
        entries: [
          {
            rule: "ce (masculine), cet (masculine before vowel/silent h), cette (feminine), ces (plural). They all mean 'this/that/these/those'.",
            examples: [
              { fr: "ce livre", en: "this/that book" },
              { fr: "cet homme", en: "this/that man" },
              { fr: "cette maison", en: "this/that house" },
              { fr: "ces enfants", en: "these/those children" },
            ],
          },
          {
            rule: "To distinguish 'this' from 'that', add -ci or -l\u00e0 after the noun.",
            examples: [
              { fr: "ce livre-ci / ce livre-l\u00e0", en: "this book / that book" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "adverbs",
    title: "Adverbs",
    icon: "gauge",
    topics: [
      {
        id: "forming_adverbs",
        title: "Forming Adverbs",
        entries: [
          {
            rule: "Most adverbs are formed by adding -ment to the feminine form of the adjective.",
            examples: [
              { fr: "lent \u2192 lente \u2192 lentement", en: "slowly" },
              { fr: "heureux \u2192 heureuse \u2192 heureusement", en: "fortunately" },
              { fr: "doux \u2192 douce \u2192 doucement", en: "gently" },
            ],
          },
          {
            rule: "Adjectives ending in a vowel: add -ment to the masculine form.",
            examples: [
              { fr: "vrai \u2192 vraiment", en: "truly" },
              { fr: "poli \u2192 poliment", en: "politely" },
            ],
          },
          {
            rule: "Adjectives ending in -ent \u2192 -emment, -ant \u2192 -amment.",
            examples: [
              { fr: "\u00e9vident \u2192 \u00e9videmment", en: "obviously" },
              { fr: "constant \u2192 constamment", en: "constantly" },
            ],
          },
          {
            rule: "Common irregular adverbs.",
            examples: [
              { fr: "bon \u2192 bien (well), mauvais \u2192 mal (badly)", en: "" },
              { fr: "vite (fast/quickly), t\u00f4t (early), tard (late)", en: "" },
              { fr: "beaucoup (a lot), peu (little), trop (too much), assez (enough)", en: "" },
              { fr: "toujours (always), souvent (often), parfois (sometimes), jamais (never)", en: "" },
              { fr: "d\u00e9j\u00e0 (already), encore (still/again), bient\u00f4t (soon)", en: "" },
            ],
          },
        ],
      },
      {
        id: "adverb_placement",
        title: "Adverb Placement",
        entries: [
          {
            rule: "Short, common adverbs (bien, mal, vite, d\u00e9j\u00e0, encore, toujours, souvent, beaucoup, trop, peu) usually go directly after the conjugated verb. In compound tenses, they go between the auxiliary and the past participle.",
            examples: [
              { fr: "Elle parle bien fran\u00e7ais.", en: "She speaks French well." },
              { fr: "J'ai beaucoup mang\u00e9.", en: "I ate a lot." },
              { fr: "Il a d\u00e9j\u00e0 fini.", en: "He has already finished." },
            ],
          },
          {
            rule: "Longer adverbs (usually those ending in -ment) typically go after the past participle or at the end of the clause.",
            examples: [
              { fr: "Il a parl\u00e9 lentement.", en: "He spoke slowly." },
              { fr: "Elle travaille efficacement.", en: "She works efficiently." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "negation",
    title: "Negation",
    icon: "x-circle",
    topics: [
      {
        id: "basic_negation",
        title: "Basic Negation",
        entries: [
          {
            rule: "Negation wraps around the conjugated verb with ne\u2026pas. In compound tenses, ne\u2026pas wraps around the auxiliary.",
            examples: [
              { fr: "Je ne parle pas anglais.", en: "I don't speak English." },
              { fr: "Elle n'a pas compris.", en: "She didn't understand." },
              { fr: "Nous n'allons pas venir.", en: "We're not going to come." },
            ],
            tip: "In spoken French, 'ne' is often dropped: Je parle pas anglais.",
          },
        ],
      },
      {
        id: "other_negations",
        title: "Other Negative Expressions",
        entries: [
          {
            rule: "ne\u2026jamais (never), ne\u2026rien (nothing), ne\u2026personne (nobody), ne\u2026plus (no longer/no more), ne\u2026que (only), ne\u2026aucun(e) (not a single), ne\u2026ni\u2026ni (neither\u2026nor).",
            examples: [
              { fr: "Je ne fume jamais.", en: "I never smoke." },
              { fr: "Il ne dit rien.", en: "He says nothing." },
              { fr: "Je ne connais personne ici.", en: "I don't know anyone here." },
              { fr: "Elle ne travaille plus.", en: "She no longer works." },
              { fr: "Je n'ai que 5 euros.", en: "I only have 5 euros." },
              { fr: "Il ne boit ni caf\u00e9 ni th\u00e9.", en: "He drinks neither coffee nor tea." },
            ],
          },
          {
            rule: "personne and rien can also be subjects. In that case they come before the verb.",
            examples: [
              { fr: "Personne ne comprend.", en: "Nobody understands." },
              { fr: "Rien ne marche.", en: "Nothing works." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "questions",
    title: "Asking Questions",
    icon: "help-circle",
    topics: [
      {
        id: "yes_no_questions",
        title: "Yes/No Questions",
        entries: [
          {
            rule: "Three ways to ask yes/no questions, from most casual to most formal.",
            examples: [
              { fr: "Tu parles fran\u00e7ais ? (rising intonation \u2014 casual)", en: "You speak French?" },
              { fr: "Est-ce que tu parles fran\u00e7ais ? (neutral/standard)", en: "Do you speak French?" },
              { fr: "Parles-tu fran\u00e7ais ? (inversion \u2014 formal)", en: "Do you speak French?" },
            ],
            tip: "In everyday conversation, rising intonation is the most common. 'Est-ce que' is always safe. Inversion is mainly for writing and formal speech.",
          },
          {
            rule: "With inversion, if the verb ends in a vowel and the subject is il/elle/on, add -t- for pronunciation.",
            examples: [
              { fr: "Parle-t-il fran\u00e7ais ?", en: "Does he speak French?" },
              { fr: "A-t-elle un fr\u00e8re ?", en: "Does she have a brother?" },
            ],
          },
        ],
      },
      {
        id: "question_words",
        title: "Question Words",
        entries: [
          {
            rule: "Common question words. They can be used with est-ce que or inversion.",
            examples: [
              { fr: "qui \u2014 who", en: "Qui est l\u00e0 ? (Who is there?)" },
              { fr: "que / qu'est-ce que \u2014 what", en: "Qu'est-ce que tu fais ? (What are you doing?)" },
              { fr: "o\u00f9 \u2014 where", en: "O\u00f9 habites-tu ? (Where do you live?)" },
              { fr: "quand \u2014 when", en: "Quand est-ce qu'il arrive ? (When does he arrive?)" },
              { fr: "pourquoi \u2014 why", en: "Pourquoi tu pleures ? (Why are you crying?)" },
              { fr: "comment \u2014 how", en: "Comment \u00e7a va ? (How are you?)" },
              { fr: "combien (de) \u2014 how much/many", en: "Combien \u00e7a co\u00fbte ? (How much does it cost?)" },
            ],
          },
          {
            rule: "'Quel(le)(s)' means 'which/what' and agrees with the noun. quel (m.sg), quelle (f.sg), quels (m.pl), quelles (f.pl).",
            examples: [
              { fr: "Quelle heure est-il ?", en: "What time is it?" },
              { fr: "Quels films aimes-tu ?", en: "Which films do you like?" },
              { fr: "Quel est ton nom ?", en: "What is your name?" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "prepositions",
    title: "Prepositions",
    icon: "map-pin",
    topics: [
      {
        id: "prepositions_place",
        title: "Prepositions of Place",
        entries: [
          {
            rule: "Countries: use 'en' for feminine countries and continents, 'au' for masculine countries, 'aux' for plural countries.",
            examples: [
              { fr: "en France, en Italie, en Asie", en: "(feminine or starting with vowel)" },
              { fr: "au Japon, au Canada, au Mexique", en: "(masculine)" },
              { fr: "aux \u00c9tats-Unis, aux Pays-Bas", en: "(plural)" },
            ],
            tip: "Most countries ending in -e are feminine (la France, la Chine). Exceptions: le Mexique, le Cambodge, le Mozambique.",
          },
          {
            rule: "Cities: use '\u00e0' for 'in/to' a city.",
            examples: [
              { fr: "J'habite \u00e0 Paris.", en: "I live in Paris." },
              { fr: "Je vais \u00e0 Londres.", en: "I'm going to London." },
            ],
          },
          {
            rule: "Common place prepositions: dans (in/inside), sur (on), sous (under), devant (in front of), derri\u00e8re (behind), entre (between), \u00e0 c\u00f4t\u00e9 de (next to), en face de (across from), pr\u00e8s de (near), loin de (far from).",
            examples: [
              { fr: "Le chat est sur la table.", en: "The cat is on the table." },
              { fr: "La pharmacie est en face de la gare.", en: "The pharmacy is across from the station." },
            ],
          },
        ],
      },
      {
        id: "prepositions_time",
        title: "Prepositions of Time",
        entries: [
          {
            rule: "\u00e0 = at (a specific time). en = in (months, years, seasons except spring). au = in (spring: au printemps). dans = in (a future duration).",
            examples: [
              { fr: "\u00e0 8 heures", en: "at 8 o'clock" },
              { fr: "en mars, en 2024, en \u00e9t\u00e9", en: "in March, in 2024, in summer" },
              { fr: "au printemps", en: "in spring" },
              { fr: "dans deux jours", en: "in two days (from now)" },
            ],
          },
          {
            rule: "pendant = during/for (completed duration). depuis = since/for (ongoing). pour = for (intended duration, with aller).",
            examples: [
              { fr: "J'ai travaill\u00e9 pendant trois heures.", en: "I worked for three hours." },
              { fr: "J'habite ici depuis 2020.", en: "I've been living here since 2020." },
              { fr: "Je pars pour deux semaines.", en: "I'm leaving for two weeks." },
            ],
            tip: "'Depuis' is used with the present tense in French when the action is still ongoing: J'apprends le fran\u00e7ais depuis un an. (I've been learning French for a year.)",
          },
        ],
      },
    ],
  },
  {
    id: "sentence_structure",
    title: "Sentence Structure",
    icon: "type",
    topics: [
      {
        id: "word_order",
        title: "Basic Word Order",
        entries: [
          {
            rule: "French follows Subject-Verb-Object (SVO) order, like English. However, object pronouns go before the verb.",
            examples: [
              { fr: "Marie mange une pomme.", en: "Marie eats an apple. (SVO)" },
              { fr: "Marie la mange.", en: "Marie eats it. (pronoun before verb)" },
            ],
          },
        ],
      },
      {
        id: "cest_vs_ilest",
        title: "C'est vs. Il est",
        entries: [
          {
            rule: "Use 'c'est' before a noun (with an article or determiner), a name, a stressed pronoun, or to refer to a general idea. Use 'il/elle est' before an adjective alone or before an unmodified profession/nationality.",
            examples: [
              { fr: "C'est un bon film.", en: "It's a good film. (noun with article)" },
              { fr: "C'est Marie.", en: "It's Marie. (name)" },
              { fr: "C'est int\u00e9ressant.", en: "That's interesting. (general idea)" },
              { fr: "Il est grand.", en: "He is tall. (adjective)" },
              { fr: "Elle est m\u00e9decin.", en: "She is a doctor. (profession, no article)" },
            ],
            tip: "If there's an article (un/une/le/la/des), use c'est: C'est un m\u00e9decin. If there's no article before a profession, use il/elle est: Elle est m\u00e9decin.",
          },
        ],
      },
      {
        id: "il_y_a",
        title: "Il y a",
        entries: [
          {
            rule: "'Il y a' means 'there is / there are'. It does not change for plural. It can also mean 'ago' when referring to past time.",
            examples: [
              { fr: "Il y a un probl\u00e8me.", en: "There is a problem." },
              { fr: "Il y a beaucoup de gens.", en: "There are a lot of people." },
              { fr: "Il y a trois jours.", en: "Three days ago." },
            ],
          },
        ],
      },
      {
        id: "connectors",
        title: "Common Connectors",
        entries: [
          {
            rule: "Useful words and phrases to connect ideas and build longer sentences.",
            examples: [
              { fr: "et (and), ou (or), mais (but), donc (so/therefore)", en: "" },
              { fr: "parce que / car (because), comme (as/since)", en: "" },
              { fr: "alors (so/then), puis / ensuite (then/next), enfin (finally)", en: "" },
              { fr: "cependant / pourtant (however), quand m\u00eame (all the same)", en: "" },
              { fr: "d'abord (first), en plus (moreover), par contre (on the other hand)", en: "" },
              { fr: "c'est-\u00e0-dire (that is to say), en fait (in fact), en g\u00e9n\u00e9ral (in general)", en: "" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "numbers_time",
    title: "Numbers, Dates & Time",
    icon: "calendar",
    topics: [
      {
        id: "numbers",
        title: "Numbers",
        entries: [
          {
            rule: "0\u201320: z\u00e9ro, un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix, onze, douze, treize, quatorze, quinze, seize, dix-sept, dix-huit, dix-neuf, vingt.",
            examples: [],
          },
          {
            rule: "Tens: 20 vingt, 30 trente, 40 quarante, 50 cinquante, 60 soixante. Add a hyphen + digit for 21\u201369, using 'et un' for 21, 31, 41, 51, 61.",
            examples: [
              { fr: "vingt et un (21), trente-deux (32), quarante-cinq (45), soixante-neuf (69)", en: "" },
            ],
          },
          {
            rule: "70\u201399 are built differently: 70 = soixante-dix (60+10), 80 = quatre-vingts (4\u00d720), 90 = quatre-vingt-dix (4\u00d720+10).",
            examples: [
              { fr: "soixante-quinze (75), quatre-vingts (80), quatre-vingt-cinq (85), quatre-vingt-dix-sept (97)", en: "" },
            ],
            tip: "quatre-vingts loses its -s when followed by another number: quatre-vingt-un (81).",
          },
          {
            rule: "100 = cent, 1000 = mille. Cent takes -s when multiplied and nothing follows: deux cents, but deux cent dix. Mille never takes -s.",
            examples: [
              { fr: "deux cents (200), trois cent cinquante (350), mille (1000), deux mille (2000)", en: "" },
            ],
          },
        ],
      },
      {
        id: "dates_days",
        title: "Days, Months & Dates",
        entries: [
          {
            rule: "Days: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche. Not capitalized. Use 'le' + day for habitual actions.",
            examples: [
              { fr: "Je travaille lundi.", en: "I work on Monday. (this Monday)" },
              { fr: "Je travaille le lundi.", en: "I work on Mondays. (every Monday)" },
            ],
          },
          {
            rule: "Months: janvier, f\u00e9vrier, mars, avril, mai, juin, juillet, ao\u00fbt, septembre, octobre, novembre, d\u00e9cembre. Not capitalized. Use 'en' for 'in'.",
            examples: [
              { fr: "en janvier, en d\u00e9cembre", en: "in January, in December" },
            ],
          },
          {
            rule: "Dates use cardinal numbers (not ordinals), except for the 1st: le premier (1er). Format: le + number + month + year.",
            examples: [
              { fr: "le premier janvier 2024", en: "January 1st, 2024" },
              { fr: "le 14 juillet", en: "July 14th" },
              { fr: "le 25 d\u00e9cembre", en: "December 25th" },
            ],
          },
        ],
      },
      {
        id: "telling_time",
        title: "Telling Time",
        entries: [
          {
            rule: "Use 'Il est + number + heure(s)'. Use 'et quart' (quarter past), 'et demie' (half past), 'moins le quart' (quarter to).",
            examples: [
              { fr: "Il est huit heures.", en: "It is 8 o'clock." },
              { fr: "Il est neuf heures et quart.", en: "It is 9:15." },
              { fr: "Il est dix heures et demie.", en: "It is 10:30." },
              { fr: "Il est midi moins le quart.", en: "It is 11:45 (quarter to noon)." },
              { fr: "Il est minuit.", en: "It is midnight." },
            ],
            tip: "France commonly uses the 24-hour clock: Il est 15 heures 30 = It is 3:30 PM.",
          },
        ],
      },
    ],
  },
  {
    id: "common_expressions",
    title: "Essential Expressions & Idioms",
    icon: "message-circle",
    topics: [
      {
        id: "avoir_expressions",
        title: "Expressions with 'avoir'",
        entries: [
          {
            rule: "Many expressions that use 'to be' in English use 'avoir' (to have) in French.",
            examples: [
              { fr: "avoir faim / soif", en: "to be hungry / thirsty" },
              { fr: "avoir chaud / froid", en: "to be hot / cold" },
              { fr: "avoir sommeil", en: "to be sleepy" },
              { fr: "avoir peur (de)", en: "to be afraid (of)" },
              { fr: "avoir raison / tort", en: "to be right / wrong" },
              { fr: "avoir besoin de", en: "to need" },
              { fr: "avoir envie de", en: "to feel like / want" },
              { fr: "avoir \u2026 ans", en: "to be \u2026 years old" },
              { fr: "avoir mal (\u00e0)", en: "to hurt / have pain (in)" },
              { fr: "avoir l'air (+ adj)", en: "to seem / look" },
              { fr: "avoir lieu", en: "to take place" },
              { fr: "avoir de la chance", en: "to be lucky" },
            ],
          },
        ],
      },
      {
        id: "faire_expressions",
        title: "Expressions with 'faire'",
        entries: [
          {
            rule: "'Faire' (to do/make) is used in many common expressions, especially for weather and activities.",
            examples: [
              { fr: "faire beau / mauvais / chaud / froid", en: "to be nice / bad / hot / cold weather" },
              { fr: "faire du sport / du v\u00e9lo / de la natation", en: "to play sports / cycle / swim" },
              { fr: "faire les courses", en: "to do the grocery shopping" },
              { fr: "faire la cuisine", en: "to cook" },
              { fr: "faire le m\u00e9nage", en: "to do housework" },
              { fr: "faire attention", en: "to pay attention / be careful" },
              { fr: "faire la queue", en: "to stand in line" },
              { fr: "faire une promenade", en: "to go for a walk" },
            ],
          },
        ],
      },
      {
        id: "greetings_politeness",
        title: "Greetings & Politeness",
        entries: [
          {
            rule: "Common greetings and polite expressions.",
            examples: [
              { fr: "Bonjour / Bonsoir", en: "Hello (day) / Good evening" },
              { fr: "Salut", en: "Hi / Bye (informal)" },
              { fr: "Comment allez-vous ? / \u00c7a va ?", en: "How are you? (formal / informal)" },
              { fr: "S'il vous pla\u00eet / S'il te pla\u00eet", en: "Please (formal / informal)" },
              { fr: "Merci (beaucoup)", en: "Thank you (very much)" },
              { fr: "De rien / Je vous en prie", en: "You're welcome (informal / formal)" },
              { fr: "Excusez-moi / Pardon", en: "Excuse me / Sorry" },
              { fr: "Au revoir / \u00c0 bient\u00f4t / \u00c0 demain", en: "Goodbye / See you soon / See you tomorrow" },
              { fr: "Bonne journ\u00e9e / Bonne soir\u00e9e", en: "Have a good day / evening" },
              { fr: "Enchant\u00e9(e)", en: "Nice to meet you" },
            ],
          },
        ],
      },
      {
        id: "useful_phrases",
        title: "Survival Phrases",
        entries: [
          {
            rule: "Phrases every beginner should know for getting by in French.",
            examples: [
              { fr: "Je ne comprends pas.", en: "I don't understand." },
              { fr: "Pouvez-vous r\u00e9p\u00e9ter, s'il vous pla\u00eet ?", en: "Can you repeat, please?" },
              { fr: "Parlez-vous anglais ?", en: "Do you speak English?" },
              { fr: "Comment dit-on '\u2026' en fran\u00e7ais ?", en: "How do you say '\u2026' in French?" },
              { fr: "Qu'est-ce que \u00e7a veut dire ?", en: "What does that mean?" },
              { fr: "Je suis perdu(e).", en: "I'm lost." },
              { fr: "O\u00f9 sont les toilettes ?", en: "Where are the restrooms?" },
              { fr: "C'est combien ?", en: "How much is it?" },
              { fr: "L'addition, s'il vous pla\u00eet.", en: "The check, please." },
              { fr: "Je voudrais\u2026", en: "I would like\u2026" },
            ],
          },
        ],
      },
    ],
  },
];
