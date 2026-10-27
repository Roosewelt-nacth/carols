export type Song = {
  id: string;
  title: string;
  lang: 'en' | 'ta';
  kind: 'classic' | 'joyful' | 'quiet';
  lyrics?: string;
  no?: number; // number in the Victorians Youth booklet
  page?: number; // page of public/Carols.pdf where the original is
  check?: boolean; // typed from a scan and not yet proofread
};

import { TA_SONGS } from './songs.ta';

// Stanzas are split by a blank line. A stanza that starts with "~" is the chorus.
const carol = (verses: string[], chorus?: string) => verses.flatMap((v) => (chorus ? [v, '~' + chorus] : [v])).join('\n\n');

// Starter list of well-known carols, all in the public domain. The parish team adds the Tamil carols
// and the youth's own favourites (with lyrics) in the admin screen.
export const EN_SONGS: Song[] = [
  {
    id: 'silent-night', page: 15, title: 'Silent Night', lang: 'en', kind: 'quiet',
    lyrics: carol([
      'Silent night, holy night!\nAll is calm, all is bright\nRound yon virgin mother and child.\nHoly infant so tender and mild,\nSleep in heavenly peace,\nSleep in heavenly peace.',
      'Silent night, holy night!\nShepherds quake at the sight;\nGlories stream from heaven afar,\nHeavenly hosts sing Alleluia;\nChrist the Saviour is born!\nChrist the Saviour is born!',
      "Silent night, holy night!\nSon of God, love's pure light\nRadiant beams from Thy holy face\nWith the dawn of redeeming grace,\nJesus, Lord, at Thy birth,\nJesus, Lord, at Thy birth.",
    ]),
  },
  {
    id: 'joy-world', title: 'Joy to the World', lang: 'en', kind: 'joyful',
    lyrics: carol([
      'Joy to the world! the Lord is come;\nLet earth receive her King;\nLet every heart prepare Him room,\nAnd heaven and nature sing,\nAnd heaven and nature sing,\nAnd heaven, and heaven and nature sing.',
      'Joy to the world! the Saviour reigns;\nLet men their songs employ;\nWhile fields and floods, rocks, hills, and plains\nRepeat the sounding joy,\nRepeat the sounding joy,\nRepeat, repeat the sounding joy.',
      "He rules the world with truth and grace,\nAnd makes the nations prove\nThe glories of His righteousness,\nAnd wonders of His love,\nAnd wonders of His love,\nAnd wonders, wonders of His love.",
    ]),
  },
  {
    id: 'o-come', page: 16, title: 'O Come, All Ye Faithful', lang: 'en', kind: 'classic',
    lyrics: carol(
      [
        'O come, all ye faithful, joyful and triumphant,\nO come ye, O come ye to Bethlehem;\nCome and behold Him, born the King of angels;',
        "God of God, Light of Light,\nLo, He abhors not the Virgin's womb;\nVery God, begotten, not created;",
        'Sing, choirs of angels, sing in exultation,\nSing, all ye citizens of heaven above;\nGlory to God in the highest;',
        'Yea, Lord, we greet Thee, born this happy morning;\nJesus, to Thee be glory given;\nWord of the Father, now in flesh appearing;',
      ],
      'O come, let us adore Him,\nO come, let us adore Him,\nO come, let us adore Him, Christ the Lord.',
    ),
  },
  {
    id: 'hark', title: 'Hark! The Herald Angels Sing', lang: 'en', kind: 'joyful',
    lyrics: carol(
      [
        'Hark! the herald angels sing\n"Glory to the newborn King;\nPeace on earth and mercy mild,\nGod and sinners reconciled!"\nJoyful, all ye nations rise,\nJoin the triumph of the skies;\nWith th\'angelic host proclaim,\n"Christ is born in Bethlehem!"',
        'Christ, by highest heaven adored;\nChrist, the everlasting Lord;\nLate in time behold Him come,\nOffspring of the Virgin\'s womb.\nVeiled in flesh the Godhead see;\nHail th\'incarnate Deity,\nPleased as man with men to dwell,\nJesus, our Emmanuel.',
        'Hail the heaven-born Prince of Peace!\nHail the Sun of Righteousness!\nLight and life to all He brings,\nRisen with healing in His wings.\nMild He lays His glory by,\nBorn that man no more may die,\nBorn to raise the sons of earth,\nBorn to give them second birth.',
      ],
      'Hark! the herald angels sing\n"Glory to the newborn King!"',
    ),
  },
  {
    id: 'away-manger', title: 'Away in a Manger', lang: 'en', kind: 'quiet',
    lyrics: carol([
      'Away in a manger, no crib for a bed,\nThe little Lord Jesus laid down His sweet head.\nThe stars in the bright sky looked down where He lay,\nThe little Lord Jesus asleep on the hay.',
      'The cattle are lowing, the baby awakes,\nBut little Lord Jesus, no crying He makes.\nI love Thee, Lord Jesus, look down from the sky,\nAnd stay by my cradle till morning is nigh.',
      'Be near me, Lord Jesus, I ask Thee to stay\nClose by me forever, and love me, I pray.\nBless all the dear children in Thy tender care,\nAnd take us to heaven, to live with Thee there.',
    ]),
  },
  {
    id: 'little-town', title: 'O Little Town of Bethlehem', lang: 'en', kind: 'quiet',
    lyrics: carol([
      'O little town of Bethlehem, how still we see thee lie!\nAbove thy deep and dreamless sleep the silent stars go by;\nYet in thy dark streets shineth the everlasting Light;\nThe hopes and fears of all the years are met in thee tonight.',
      "For Christ is born of Mary, and gathered all above,\nWhile mortals sleep, the angels keep their watch of wond'ring love.\nO morning stars, together proclaim the holy birth,\nAnd praises sing to God the King, and peace to men on earth.",
      'How silently, how silently, the wondrous gift is given!\nSo God imparts to human hearts the blessings of His heaven.\nNo ear may hear His coming, but in this world of sin,\nWhere meek souls will receive Him still, the dear Christ enters in.',
      'O holy Child of Bethlehem, descend to us, we pray;\nCast out our sin and enter in, be born in us today.\nWe hear the Christmas angels the great glad tidings tell;\nO come to us, abide with us, our Lord Emmanuel.',
    ]),
  },
  {
    id: 'first-noel', title: 'The First Noel', lang: 'en', kind: 'classic',
    lyrics: carol(
      [
        'The first Noel, the angel did say,\nWas to certain poor shepherds in fields as they lay;\nIn fields where they lay keeping their sheep,\nOn a cold winter\'s night that was so deep.',
        'They looked up and saw a star\nShining in the east, beyond them far;\nAnd to the earth it gave great light,\nAnd so it continued both day and night.',
        'And by the light of that same star,\nThree wise men came from country far;\nTo seek for a King was their intent,\nAnd to follow the star wherever it went.',
      ],
      'Noel, Noel, Noel, Noel,\nBorn is the King of Israel.',
    ),
  },
  {
    id: 'angels-heard', page: 15, title: 'Angels We Have Heard on High', lang: 'en', kind: 'joyful',
    lyrics: carol(
      [
        "Angels we have heard on high\nSweetly singing o'er the plains,\nAnd the mountains in reply\nEchoing their joyous strains.",
        "Shepherds, why this jubilee?\nWhy your joyous strains prolong?\nWhat the gladsome tidings be\nWhich inspire your heav'nly song?",
        'Come to Bethlehem and see\nHim whose birth the angels sing;\nCome, adore on bended knee\nChrist the Lord, the newborn King.',
      ],
      'Gloria, in excelsis Deo!\nGloria, in excelsis Deo!',
    ),
  },
  {
    id: 'we-three', title: 'We Three Kings', lang: 'en', kind: 'classic',
    lyrics: carol(
      [
        'We three kings of Orient are;\nBearing gifts we traverse afar,\nField and fountain, moor and mountain,\nFollowing yonder star.',
        "Born a King on Bethlehem's plain,\nGold I bring to crown Him again,\nKing forever, ceasing never,\nOver us all to reign.",
        'Frankincense to offer have I;\nIncense owns a Deity nigh;\nPrayer and praising, voices raising,\nWorshipping God on high.',
        'Myrrh is mine; its bitter perfume\nBreathes a life of gathering gloom;\nSorrowing, sighing, bleeding, dying,\nSealed in the stone-cold tomb.',
        'Glorious now behold Him arise;\nKing and God and Sacrifice;\nAlleluia, Alleluia,\nSounds through the earth and skies.',
      ],
      'O star of wonder, star of night,\nStar with royal beauty bright,\nWestward leading, still proceeding,\nGuide us to Thy perfect light.',
    ),
  },
  {
    id: 'good-christian', title: 'Good Christian Men, Rejoice', lang: 'en', kind: 'joyful',
    lyrics: carol([
      'Good Christian men, rejoice\nWith heart and soul and voice;\nGive ye heed to what we say:\nJesus Christ is born today;\nOx and ass before Him bow,\nAnd He is in the manger now.\nChrist is born today!\nChrist is born today!',
      "Good Christian men, rejoice\nWith heart and soul and voice;\nNow ye hear of endless bliss:\nJesus Christ was born for this!\nHe hath opened heaven's door,\nAnd man is blessed evermore.\nChrist was born for this!\nChrist was born for this!",
      'Good Christian men, rejoice\nWith heart and soul and voice;\nNow ye need not fear the grave:\nJesus Christ was born to save!\nCalls you one and calls you all\nTo gain His everlasting hall.\nChrist was born to save!\nChrist was born to save!',
    ]),
  },
  {
    id: 'it-came', title: 'It Came Upon the Midnight Clear', lang: 'en', kind: 'quiet',
    lyrics: carol([
      "It came upon the midnight clear,\nThat glorious song of old,\nFrom angels bending near the earth\nTo touch their harps of gold:\n\"Peace on the earth, good will to men,\nFrom heaven's all-gracious King.\"\nThe world in solemn stillness lay\nTo hear the angels sing.",
      "Still through the cloven skies they come\nWith peaceful wings unfurled,\nAnd still their heavenly music floats\nO'er all the weary world;\nAbove its sad and lowly plains\nThey bend on hovering wing,\nAnd ever o'er its Babel sounds\nThe blessed angels sing.",
      "And you, beneath life's crushing load,\nWhose forms are bending low,\nWho toil along the climbing way\nWith painful steps and slow,\nLook now! for glad and golden hours\nCome swiftly on the wing;\nO rest beside the weary road\nAnd hear the angels sing!",
    ]),
  },
  {
    id: 'go-tell', title: 'Go Tell It on the Mountain', lang: 'en', kind: 'joyful',
    lyrics: carol(
      [
        "While shepherds kept their watching\nO'er wand'ring flocks by night,\nBehold, from out of heaven\nThere shone a holy light.",
        'The shepherds feared and trembled\nWhen lo! above the earth\nRang out the angel chorus\nThat hailed our Saviour\'s birth.',
        'Down in a lowly manger\nThe humble Christ was born,\nAnd God sent us salvation\nThat blessed Christmas morn.',
      ],
      'Go, tell it on the mountain,\nOver the hills and everywhere;\nGo, tell it on the mountain\nThat Jesus Christ is born.',
    ),
  },
  {
    id: 'jingle-bells', page: 17, title: 'Jingle Bells', lang: 'en', kind: 'joyful',
    lyrics: carol(["Dashing through the snow\nIn a one horse open sleigh\nO'er the fields we go,\nLaughing all the way\nBells on bob tail ring,\nMaking spirits bright\nWhat fun it is to laugh and sing\nA sleighing song tonight"], "Oh, jingle bells, jingle bells\nJingle all the way\nOh, what fun it is to ride\nIn a one horse open sleigh\nJingle bells, jingle bells\nJingle all the way\nOh, what fun it is to ride\nIn a one horse open sleigh"),
  },
];

// English carols first, then the Tamil booklet carols.
export const SONGS: Song[] = [...EN_SONGS, ...TA_SONGS];
