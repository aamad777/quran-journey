export const normalizeArabic = (text: string): string => {
    return text
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, "")
        .replace(/\u0671/g, "\u0627")
        .replace(/[\u0622\u0623\u0625]/g, "\u0627")
        .replace(/\u0649/g, "\u064A")
        .replace(/\u0629/g, "\u0647")
        .trim();
};
