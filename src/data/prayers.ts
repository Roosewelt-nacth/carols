// The two Tamil prayers from the Victorians Youth booklet (handwritten on pages 1 and 2 of public/Carols.pdf).
// Typed from a scan, so please compare with the original pages. Set CHECK_PRAYERS to false once proofread.
// Words to look at: "முன்னணையில்" (the handwriting looks like முன்னிட்டில்) and "படைத்திரள் தோன்றி" in the opening prayer.
export const CHECK_PRAYERS = true;

export type PrayerLine = { who: 'leader' | 'all'; text: string };

export const OPENING_PRAYER: { page: number; lines: PrayerLine[] } = {
  page: 1,
  lines: [
    { who: 'leader', text: 'பிதா சுதன் பரிசுத்த ஆவியின் பெயராலே!' },
    { who: 'all', text: 'ஆமென்.' },
    { who: 'leader', text: 'இந்த வீட்டிற்கு சமாதானம் உண்டாவதாக.' },
    { who: 'all', text: 'இங்கு வாழும் அனைவருக்கும் சமாதானம் உண்டாவதாக.' },
    {
      who: 'leader',
      text:
        'அஞ்சாதீர்! இதோ, மக்களுக்கு மகிழ்ச்சியூட்டும் மாபெரும் நற்செய்தியை உங்களுக்கு அறிவிக்கிறேன். இன்று தாவீதின் ஊரிலே உங்களுக்காக மீட்பர் பிறந்துள்ளார். அவரே ஆண்டவராகிய மெசியா. குழந்தை ஒன்றைத் துணிகளில் பொதிந்து முன்னணையில் கிடத்தி இருப்பதைக் காண்பீர்கள். இதுவே உங்களுக்கு அடையாளம் ஆகும் என்றார். உடனே வானோர் படைத்திரள் தோன்றி, உன்னதங்களிலே இறைவனுக்கு மகிமை உண்டாவதாக. புவியில் நல்மனத்தோர்க்கு அமைதியும் ஆகுக. என்று கடவுளைப் போற்றியும் புகழ்ந்தும் பாடினர்.',
    },
  ],
};

export const CLOSING_PRAYER: { page: number; paragraphs: string[] } = {
  page: 2,
  paragraphs: [
    'எங்கள் அன்பு தந்தையே இறைவா!',
    'இந்த இனிய மாலை வேளைக்காக உமக்கு நன்றி கூறுகின்றோம்.',
    'கடந்த ஆண்டு முழுவதும் இக்குடும்பத்தினரை காத்து வழி நடத்தியதற்காக உமக்கு நன்றி செலுத்துகிறோம்.',
    'இனி வரும் நாட்களிலும் இக்குடும்பத்தில் உள்ள ஒவ்வொருவரையும் ஆசீர்வதித்து பாதுகாத்து நல் வழியில் நடத்திட உம்மை வேண்டுகிறோம்.',
    'குழந்தை இயேசு கிறிஸ்துவின் பிறப்பு இக்குடும்பத்தில் உள்ள அனைவருக்கும் ஒற்றுமை, அன்பு, சமாதானம், என்றென்றும் சந்தோசம் நிலைத்திருக்க கிருபை செய்தருளும். ஆமேன்!',
  ],
};
