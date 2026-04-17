import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePublishingCapacity } from "@/hooks/usePublishingCapacity";
import { storage } from "@/lib/storage";

export type MotivationImageKey =
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday";

export interface WritingMotivationData {
    dailyMessage: string;
    dayIndex: number;
    dayNamePersian: string;
    currentStreak: number;
    longestStreak: number;
    articlesThisWeek: number;
    articlesThisMonth: number;
    maxMonthly: number;
    maxWeekly: number;
    hasWrittenToday: boolean;
    nextResetTime: number;
    motivationImage: MotivationImageKey;
}

const DAY_MESSAGES: Record<number, string> = {
    0: "یکشنبهٔ نو: یک فکر بنویس",
    1: "دوشنبه شروع: یک بینش بنویس",
    2: "سه‌شنبه نکته: یک حقیقت تدریس کن",
    3: "چهارشنبه: سریع بنویس، الآن بفرست",
    4: "پنج‌شنبه فکر: ۳ خط بنویس",
    5: "جمعه درخشش: یک ایده بنویس",
    6: "شنبه گرمایش: یک نظر و دلیل بنویس",
};

const DAY_NAMES_PERSIAN = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنج‌شنبه",
    "جمعه",
    "شنبه",
];

const IMAGE_KEYS: MotivationImageKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

const DEFAULT_MOTIVATION_DATA: WritingMotivationData = {
    dailyMessage: "امروز بنویسید و زنجیرهٔ نوشتنتان را آغاز کنید",
    dayIndex: 0,
    dayNamePersian: "یکشنبه",
    currentStreak: 0,
    longestStreak: 0,
    articlesThisWeek: 0,
    articlesThisMonth: 0,
    maxMonthly: 20,
    maxWeekly: 5,
    hasWrittenToday: false,
    nextResetTime: Date.now() + 86400000,
    motivationImage: "sunday",
};

interface WritingStreakData {
    currentStreak: number;
    longestStreak: number;
    lastWriteDate: string | null;
}

function getKabulDate(): Date {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const kabulOffset = 4.5 * 60 * 60000;
    return new Date(utcTime + kabulOffset);
}

function getTranslationDayName(dayIndex: number) {
    return DAY_NAMES_PERSIAN[dayIndex] ?? DAY_NAMES_PERSIAN[0];
}

function getDateKey(date: Date) {
    return date.toISOString().split("T")[0];
}

function getNextKabulMidnight(date: Date) {
    const next = new Date(date.getTime());
    next.setHours(24, 0, 0, 0);
    return next.getTime();
}

export function getKabulDateKey() {
    return getDateKey(getKabulDate());
}

export function useWritingMotivation() {
    const { user } = useAuth();
    const { stats } = usePublishingCapacity();
    const [motivationData, setMotivationData] = useState<WritingMotivationData>(DEFAULT_MOTIVATION_DATA);

    useEffect(() => {
        if (!user) {
            setMotivationData(DEFAULT_MOTIVATION_DATA);
            return;
        }

        const now = getKabulDate();
        const dayIndex = now.getDay();
        const todayKey = getDateKey(now);
        const lastPublishDate = storage.get<string | null>(`last_publish_${user.id}`, null);
        const hasWrittenToday = lastPublishDate === todayKey;

        const streakStorage = storage.get<WritingStreakData>(`writing_streak_${user.id}`, {
            currentStreak: 0,
            longestStreak: 0,
            lastWriteDate: null,
        });

        let currentStreak = streakStorage.currentStreak;
        let longestStreak = streakStorage.longestStreak;
        let lastWriteDate = streakStorage.lastWriteDate;

        if (hasWrittenToday && lastWriteDate !== todayKey) {
            const yesterdayKey = getDateKey(new Date(now.getTime() - 86400000));
            if (lastWriteDate === yesterdayKey) {
                currentStreak = Math.max(1, streakStorage.currentStreak + 1);
            } else {
                currentStreak = 1;
            }
            longestStreak = Math.max(longestStreak, currentStreak);
            lastWriteDate = todayKey;
            storage.set(`writing_streak_${user.id}`, { currentStreak, longestStreak, lastWriteDate });
        }

        const nextResetTime = getNextKabulMidnight(now);

        setMotivationData({
            dailyMessage: DAY_MESSAGES[dayIndex] ?? DEFAULT_MOTIVATION_DATA.dailyMessage,
            dayIndex,
            dayNamePersian: getTranslationDayName(dayIndex),
            currentStreak,
            longestStreak,
            articlesThisWeek: stats?.articlesThisWeek ?? 0,
            articlesThisMonth: stats?.articlesThisMonth ?? 0,
            maxMonthly: stats?.maxMonthly ?? 20,
            maxWeekly: stats?.maxWeekly ?? 5,
            hasWrittenToday,
            nextResetTime,
            motivationImage: IMAGE_KEYS[dayIndex] ?? "sunday",
        });
    }, [user, stats]);

    return motivationData;
}
