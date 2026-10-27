// The two prayers from the Victorians Youth booklet (handwritten Tamil on pages 1 and 2 of public/Carols.pdf),
// with a plain English version for English speaking families. The Tamil was typed from a scan and the English is
// a translation, so please check both. Set CHECK_PRAYERS to false once they have been proofread.
// Tamil words to look at: "முன்னணையில்" (the handwriting looks like முன்னிட்டில்) and "படைத்திரள் தோன்றி".
export const CHECK_PRAYERS = true;

export type Bi = { ta: string; en: string };
export type PrayerLine = { who: 'leader' | 'all' } & Bi;

export const OPENING_PRAYER: { page: number; lines: PrayerLine[] } = {
  page: 1,
  lines: [
    { who: 'leader', ta: 'பிதா சுதன் பரிசுத்த ஆவியின் பெயராலே!', en: 'In the name of the Father, and of the Son, and of the Holy Spirit!' },
    { who: 'all', ta: 'ஆமென்.', en: 'Amen.' },
    { who: 'leader', ta: 'இந்த வீட்டிற்கு சமாதானம் உண்டாவதாக.', en: 'Peace be upon this house.' },
    { who: 'all', ta: 'இங்கு வாழும் அனைவருக்கும் சமாதானம் உண்டாவதாக.', en: 'May peace be upon everyone who lives here.' },
    {
      who: 'leader',
      ta: 'அஞ்சாதீர்! இதோ, மக்களுக்கு மகிழ்ச்சியூட்டும் மாபெரும் நற்செய்தியை உங்களுக்கு அறிவிக்கிறேன். இன்று தாவீதின் ஊரிலே உங்களுக்காக மீட்பர் பிறந்துள்ளார். அவரே ஆண்டவராகிய மெசியா. குழந்தை ஒன்றைத் துணிகளில் பொதிந்து முன்னணையில் கிடத்தி இருப்பதைக் காண்பீர்கள். இதுவே உங்களுக்கு அடையாளம் ஆகும் என்றார். உடனே வானோர் படைத்திரள் தோன்றி, உன்னதங்களிலே இறைவனுக்கு மகிமை உண்டாவதாக. புவியில் நல்மனத்தோர்க்கு அமைதியும் ஆகுக. என்று கடவுளைப் போற்றியும் புகழ்ந்தும் பாடினர்.',
      en: 'Do not be afraid! Behold, I bring you good news of great joy for all the people. Today, in the city of David, a Saviour has been born for you. He is Christ the Lord. You will find a child wrapped in cloths and lying in a manger. This will be the sign for you. Suddenly the host of heaven appeared, praising God and singing: "Glory to God in the highest, and on earth peace to people of good will."',
    },
  ],
};

export const CLOSING_PRAYER: { page: number; paragraphs: Bi[] } = {
  page: 2,
  paragraphs: [
    { ta: 'எங்கள் அன்பு தந்தையே இறைவா!', en: 'Our loving Father, God!' },
    { ta: 'இந்த இனிய மாலை வேளைக்காக உமக்கு நன்றி கூறுகின்றோம்.', en: 'We thank you for this lovely evening.' },
    { ta: 'கடந்த ஆண்டு முழுவதும் இக்குடும்பத்தினரை காத்து வழி நடத்தியதற்காக உமக்கு நன்றி செலுத்துகிறோம்.', en: 'We thank you for protecting and guiding this family throughout the past year.' },
    { ta: 'இனி வரும் நாட்களிலும் இக்குடும்பத்தில் உள்ள ஒவ்வொருவரையும் ஆசீர்வதித்து பாதுகாத்து நல் வழியில் நடத்திட உம்மை வேண்டுகிறோம்.', en: 'In the days to come, we ask you to bless, protect and lead every member of this family in the right way.' },
    {
      ta: 'குழந்தை இயேசு கிறிஸ்துவின் பிறப்பு இக்குடும்பத்தில் உள்ள அனைவருக்கும் ஒற்றுமை, அன்பு, சமாதானம், என்றென்றும் சந்தோசம் நிலைத்திருக்க கிருபை செய்தருளும். ஆமேன்!',
      en: 'Through the birth of the child Jesus Christ, grant that unity, love, peace and lasting joy remain with everyone in this family. Amen!',
    },
  ],
};
