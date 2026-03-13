import { describe, it, expect } from 'vitest';
import { calculateScore, getMaxScore, getScoreRank } from './scoring';

describe('calculateScore', () => {
  it('ヒント1つで正解: 10点', () => {
    expect(calculateScore(1, true)).toBe(10);
  });

  it('ヒント2つで正解: 9点', () => {
    expect(calculateScore(2, true)).toBe(9);
  });

  it('ヒント3つで正解: 8点', () => {
    expect(calculateScore(3, true)).toBe(8);
  });

  it('ヒント9つで正解: 2点', () => {
    expect(calculateScore(9, true)).toBe(2);
  });

  it('立ち絵（ヒント10）で正解: 1点', () => {
    expect(calculateScore(10, true)).toBe(1);
  });

  it('不正解: 0点', () => {
    expect(calculateScore(1, false)).toBe(0);
    expect(calculateScore(5, false)).toBe(0);
    expect(calculateScore(10, false)).toBe(0);
  });

  it('ヒント数が10を超えても最低1点', () => {
    expect(calculateScore(11, true)).toBe(1);
    expect(calculateScore(20, true)).toBe(1);
  });
});

describe('getMaxScore', () => {
  it('10を返す', () => {
    expect(getMaxScore()).toBe(10);
  });
});

describe('getScoreRank', () => {
  it('10点: SS', () => {
    expect(getScoreRank(10)).toBe('SS');
  });

  it('9点: S', () => {
    expect(getScoreRank(9)).toBe('S');
  });

  it('8点: S', () => {
    expect(getScoreRank(8)).toBe('S');
  });

  it('7点: A', () => {
    expect(getScoreRank(7)).toBe('A');
  });

  it('6点: A', () => {
    expect(getScoreRank(6)).toBe('A');
  });

  it('5点: B', () => {
    expect(getScoreRank(5)).toBe('B');
  });

  it('4点: B', () => {
    expect(getScoreRank(4)).toBe('B');
  });

  it('3点: C', () => {
    expect(getScoreRank(3)).toBe('C');
  });

  it('1点: C', () => {
    expect(getScoreRank(1)).toBe('C');
  });

  it('0点: D', () => {
    expect(getScoreRank(0)).toBe('D');
  });
});
