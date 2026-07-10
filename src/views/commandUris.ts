export function achievementDetailsCommandUri(achievementId: string): string {
  return `command:vscodeLearn.showAchievementInfo?${encodeURIComponent(JSON.stringify([achievementId]))}`;
}
