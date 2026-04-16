CREATE TABLE `leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(64) NOT NULL,
	`avatarId` varchar(32) NOT NULL DEFAULT 'warrior',
	`xp` int NOT NULL DEFAULT 0,
	`totalReps` int NOT NULL DEFAULT 0,
	`totalWorkouts` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`levelTitle` varchar(32) NOT NULL DEFAULT 'Rookie',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboard_id` PRIMARY KEY(`id`)
);
