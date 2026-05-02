import { useState } from "react";
import { X, Info, Mic } from "lucide-react";
import { ARABIC_ALPHABET, type LetterData } from "@/lib/arabicData";
import { TAJWEED_RULES } from "@/lib/tajweedParser";

interface AlphabetTajweedProps {
  themeTextColor: string;
  themeMutedText: string;
  themeCardBg: string;
  themeAccentColor: string;
}

// Convert hex color to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const AlphabetTajweed = ({
  themeTextColor,
  themeMutedText,
  themeCardBg,
  themeAccentColor,
}: AlphabetTajweedProps) => {
  const [selectedLetter, setSelectedLetter] = useState<LetterData | null>(null);

  const getLetterColor = (item: LetterData): string => {
    if (item.tajweedRules.length === 0) return themeTextColor;
    const primaryRule = TAJWEED_RULES[item.tajweedRules[0]];
    return primaryRule?.color ?? themeTextColor;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 fade-in">
      {/* Header + Legend */}
      <div
        className="p-5 rounded-2xl border text-center themed-card"
        style={{ "--themed-card-bg": themeCardBg as any, borderColor: `${themeMutedText}30` }}
      >
        <h2 className="text-xl font-bold font-arabic mb-1" style={{ color: themeTextColor }}>
          مخارج الحروف وأحكام التجويد
        </h2>
        <p className="font-arabic text-xs mb-3" style={{ color: themeMutedText }}>
          لون الحرف يطابق حكم التجويد • اضغط للتفاصيل
        </p>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 px-2">
          {Object.entries(TAJWEED_RULES).map(([key, rule]) => (
            <span key={key} className="flex items-center gap-1 text-[10px] font-arabic">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: rule.color }} />
              <span style={{ color: rule.color, fontWeight: 700 }}>{rule.labelAr}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Alphabet Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3" dir="rtl">
        {ARABIC_ALPHABET.map((item) => {
          const color = getLetterColor(item);
          const isSelected = selectedLetter?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedLetter(item)}
              className="flex flex-col items-center justify-center rounded-2xl border transition-all hover:scale-105 active:scale-95 p-3 gap-2"
              style={{
                backgroundColor: hexToRgba(color, isSelected ? 0.2 : 0.1),
                borderColor: hexToRgba(color, isSelected ? 1 : 0.5),
                boxShadow: isSelected
                  ? `0 0 16px ${hexToRgba(color, 0.5)}`
                  : `0 2px 6px ${hexToRgba(color, 0.2)}`,
              }}
            >
              {/* Letter colored with its tajweed rule color */}
              <span className="text-3xl font-bold font-arabic leading-none" style={{ color }}>
                {item.letter}
              </span>

              {/* Dots for all associated rules */}
              <div className="flex justify-center gap-1 flex-wrap min-h-[8px]">
                {item.tajweedRules.map((ruleKey) => {
                  const rule = TAJWEED_RULES[ruleKey];
                  if (!rule) return null;
                  return (
                    <span
                      key={ruleKey}
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: rule.color }}
                      title={rule.labelAr}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Popup */}
      {selectedLetter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedLetter(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-6 border-2 shadow-2xl relative max-h-[88vh] overflow-y-auto themed-card"
            style={{
              "--themed-card-bg": themeCardBg as any,
              borderColor: getLetterColor(selectedLetter),
            }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <button
              onClick={() => setSelectedLetter(null)}
              className="absolute top-4 left-4 p-2 rounded-full"
              style={{ color: themeMutedText }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-5">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-5xl font-bold font-arabic mb-3 border-4"
                style={{
                  backgroundColor: hexToRgba(getLetterColor(selectedLetter), 0.12),
                  color: getLetterColor(selectedLetter),
                  borderColor: hexToRgba(getLetterColor(selectedLetter), 0.4),
                }}
              >
                {selectedLetter.letter}
              </div>
              <h3 className="text-2xl font-bold font-arabic" style={{ color: getLetterColor(selectedLetter) }}>
                حرف {selectedLetter.name}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Makhraj */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: hexToRgba(getLetterColor(selectedLetter), 0.07) }}>
                <h4 className="flex items-center gap-2 font-bold font-arabic mb-2 text-sm" style={{ color: getLetterColor(selectedLetter) }}>
                  <Info className="w-4 h-4" />
                  كيف تنطقه؟ (المخرج)
                </h4>
                <p className="font-arabic font-bold text-base mb-1" style={{ color: themeTextColor }}>{selectedLetter.makhraj}</p>
                <p className="font-arabic text-sm leading-relaxed" style={{ color: themeMutedText }}>{selectedLetter.makhrajDesc}</p>
              </div>

              {/* Sifaat */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: hexToRgba(getLetterColor(selectedLetter), 0.07) }}>
                <h4 className="flex items-center gap-2 font-bold font-arabic mb-2 text-sm" style={{ color: getLetterColor(selectedLetter) }}>
                  <Mic className="w-4 h-4" />
                  الصفات
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLetter.sifaat.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-sm font-arabic font-medium border"
                      style={{ color: themeTextColor, borderColor: hexToRgba(getLetterColor(selectedLetter), 0.3) }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tajweed Rules */}
              {selectedLetter.tajweedRules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold font-arabic text-sm px-1" style={{ color: themeTextColor }}>
                    أحكام التجويد لهذا الحرف:
                  </h4>
                  {selectedLetter.tajweedRules.map((ruleKey) => {
                    const rule = TAJWEED_RULES[ruleKey];
                    if (!rule) return null;
                    return (
                      <div
                        key={ruleKey}
                        className="p-3 rounded-xl border-2"
                        style={{
                          backgroundColor: hexToRgba(rule.color, 0.08),
                          borderColor: hexToRgba(rule.color, 0.5),
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: rule.color }} />
                          <span className="font-bold font-arabic text-sm" style={{ color: rule.color }}>{rule.labelAr}</span>
                        </div>
                        <p className="font-arabic text-xs leading-relaxed" style={{ color: themeTextColor }}>{rule.description}</p>
                        <p className="font-arabic text-xs mt-1" style={{ color: rule.color }}>▶ {rule.howTo}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLetter(null)}
              className="w-full mt-5 py-3 rounded-xl font-bold font-arabic"
              style={{ backgroundColor: getLetterColor(selectedLetter), color: '#fff' }}
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlphabetTajweed;
