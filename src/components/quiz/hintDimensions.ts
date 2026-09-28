// HintCard.tsx の min-h-[84px] と揃える。Tailwindのarbitrary valueは静的な文字列でないと
// JITに拾われないため、あちらのクラス自体はこの定数を直接参照できない。値を変える場合は
// HintCard.tsx側のクラスもこの値に合わせて直すこと
export const HINT_CARD_MIN_HEIGHT_PX = 84;

// HintList/MobileQuizLayout共通のgap-2（0.5rem=8px）と揃える
export const HINT_GRID_GAP_PX = 8;
