export interface HistoryItem {
  id: string;
  input: string;
  output: string;
  direction: 'ja-zh' | 'zh-ja';
  timestamp: number;
}
