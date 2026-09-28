/*
  The film's timeline: one entry per beat.
  t = start time in seconds. caption = on-screen text (minimal).
  say = narration line for this beat (voice is recorded separately).
*/
export const BEATS = [
  { id: 'intro', t: 0, chapter: 'הודעה אחת', caption: 'הודעה אחת.', say: 'רועי כותב הודעה אחת: מה כתוב בדוח השנתי על ההכנסות?' },
  { id: 'toModel', t: 7, caption: 'זה כל מה שהמודל מקבל?', say: 'נדמה שהמודל מקבל רק את ההודעה הזאת.' },
  { id: 'reveal', t: 14, chapter: 'מה באמת נשלח', caption: 'לא בדיוק.', say: 'אבל כשמסתכלים רחב יותר, רואים שמערכת ה-AI יכולה לשלוח למודל יותר מזה.' },
  { id: 'cardSys', t: 18, caption: 'הוראות מערכת', say: 'הוראות מערכת, שקובעות איך לענות,' },
  { id: 'cardHist', t: 21, caption: 'היסטוריית שיחה', say: 'חלקים רלוונטיים מהשיחה עד עכשיו,' },
  { id: 'cardFile', t: 24, caption: 'קבצים', say: 'קבצים שצורפו,' },
  { id: 'cardTool', t: 27, caption: 'תוצאות של כלים', say: 'ותוצאות של כלים — למשל חיפוש.' },
  { id: 'assembled', t: 30, caption: 'הכול נשלח יחד — עבור התשובה הזאת.', say: 'כל אלה נאספים יחד ונשלחים למודל, עבור התשובה הזאת.' },
  { id: 'frame', t: 36, chapter: 'Context Window', caption: 'Context Window', note: 'המקום המוגבל למידע שהמודל מקבל עכשיו', say: 'המקום שבו נמצא המידע הזה נקרא Context Window. זה מרחב העבודה של המודל — והוא מוגבל.' },
  { id: 'outside', t: 43, caption: 'רק מה שנשלח עכשיו — לא כל מה שיש במערכת.', say: 'שימו לב: לא כל מה שיש במערכת נמצא שם. רק המידע שנשלח למודל עכשיו.' },
  { id: 'tokens', t: 49, chapter: 'Tokens', caption: 'כל מידע תופס Tokens.', say: 'המודל לא סופר מילים או עמודים, אלא Tokens — יחידות קטנות של טקסט. כל פריט תופס מקום.' },
  { id: 'filled', t: 58, caption: 'החלון מתמלא.', say: 'וככל שמוסיפים מידע, החלון מתמלא.' },
  { id: 'doc', t: 62, chapter: 'מסמך גדול', caption: 'מסמך גדול.', say: 'עכשיו רועי מצרף מסמך גדול — הדוח השנתי.' },
  { id: 'overflow', t: 66, caption: 'אין מספיק מקום.', note: 'המחשה של מקום מוגבל. מה שקורה בפועל — תלוי במערכת.', say: 'והפעם אין מספיק מקום. זו המחשה של המגבלה; מה שקורה בפועל תלוי במערכת.' },
  { id: 'remove', t: 75, chapter: 'שלוש דרכים', caption: '1 · להסיר מידע ישן שלא רלוונטי', say: 'מה אפשר לעשות? אפשר להסיר מידע ישן שכבר לא רלוונטי למשימה.' },
  { id: 'rew1', t: 84, caption: '', say: '' },
  { id: 'compress', t: 86, caption: '2 · לסכם ולדחוס', say: 'אפשר לסכם ולדחוס מידע, כך שהעיקר נשאר בפחות מקום.' },
  { id: 'rew2', t: 95, caption: '', say: '' },
  { id: 'retrieve', t: 97, caption: '3 · לשלוף רק את החלקים הרלוונטיים', say: 'ואפשר לשלוף מהמסמך רק את החלקים שקשורים לשאלה.' },
  { id: 'compare3', t: 108, caption: 'כל דרך משאירה משהו אחר.', say: 'כל דרך משאירה בחלון משהו אחר. המשימה היא שקובעת מה חשוב.' },
  { id: 'split', t: 115, chapter: 'יותר ≠ טוב יותר', caption: 'אותה שאלה. שני Context.', say: 'עכשיו — אותה שאלה, עם שני Context שונים.' },
  { id: 'noise', t: 121, caption: 'כפילויות · מידע ישן · לא קשור · סתירות', say: 'באחד — רק מה שרלוונטי. בשני — כפילויות, מידע ישן, מידע לא קשור ואפילו סתירות.' },
  { id: 'goal', t: 128, caption: 'יותר Context ≠ בהכרח תשובה טובה יותר', note: 'המטרה: המידע הנכון — לא המקסימום.', say: 'יותר Context לא אומר בהכרח תשובה טובה יותר. המטרה היא לא למלא את החלון, אלא להכניס אליו את המידע הנכון.' },
  { id: 'ctx', t: 135, chapter: 'Context · Memory · Training', caption: 'Context — מה שזמין למודל עכשיו', say: 'ועוד הבחנה חשובה. בשיחה רועי כותב: "אני מעדיף תשובות קצרות". זה נכנס ל-Context — ולכן זמין למודל עכשיו.' },
  { id: 'weights', t: 142, caption: 'המודל עצמו לא משתנה.', say: 'אבל זה לא משנה את המודל עצמו. הפרמטרים שלו נשארים כמו שהיו.' },
  { id: 'memSave', t: 148, caption: 'Memory — שמירה מחוץ למודל', say: 'מערכת עם זיכרון יכולה לשמור את המידע הזה בחוץ — מחוץ למודל.' },
  { id: 'chatEnd', t: 154, caption: 'השיחה נגמרה. ה-Context התרוקן.', say: 'כשהשיחה נגמרת, ה-Context שלה כבר לא זמין.' },
  { id: 'later', t: 159, caption: 'שבוע אחר כך. שיחה חדשה.', say: 'שבוע אחר כך נפתחת שיחה חדשה. המודל לא השתנה בינתיים.' },
  { id: 'memBack', t: 164, caption: 'מהזיכרון — חזרה ל-Context', say: 'המערכת שולפת את המידע מהזיכרון ומכניסה אותו ל-Context החדש. המודל רואה אותו כי הוא ב-Context — לא כי הוא למד אותו.' },
  { id: 'training', t: 171, caption: 'Training — תהליך נפרד שמשנה את המודל', say: 'אימון הוא תהליך נפרד לגמרי, עם נתונים משלו, שמשנה את הפרמטרים של המודל.' },
  { id: 'noAuto', t: 178, caption: 'שיחה קודמת ≠ אימון', note: 'שיחה לא הופכת לאימון רק כי עבר זמן.', say: 'ושיחה קודמת לא הופכת לאימון רק כי עבר זמן.' },
  { id: 'final', t: 186, chapter: 'המודל המנטלי', caption: '', say: 'אז מה זה Context Window? מרחב העבודה המוגבל של המודל, עבור המשימה הנוכחית.' },
  { id: 'engineering', t: 195, caption: '', say: 'ואיך בוחרים מה נכנס אליו? זה כבר Context Engineering — ונגיע לזה בהמשך.' },
] as const

export type BeatId = (typeof BEATS)[number]['id']
export const END = 205

export const B = Object.fromEntries(BEATS.map((b, i) => [b.id, i])) as Record<BeatId, number>

export const CHAPTERS = BEATS.flatMap((b, i) => ('chapter' in b ? [{ title: b.chapter, beat: i, t: b.t }] : []))

export function beatAt(t: number) {
  let i = 0
  while (i + 1 < BEATS.length && BEATS[i + 1]!.t <= t) i++
  return i
}
