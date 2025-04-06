# API Documentation

## Handlers

### AutoModHandler

The AutoMod system provides a flexible way to create and manage moderation rules.

```typescript
interface AutoModFilter {
  name: string;
  description: string;
  execute: (message: Message) => Promise<boolean>;
  action: (message: Message) => Promise<boolean>;
}

class AutoModHandler {
  static registerFilter(filter: AutoModFilter): void;
  static removeFilter(name: string): void;
  static getFilter(name: string): AutoModFilter;
  static processMessage(message: Message): Promise<void>;
}
```

### XPHandler

Manages user experience points and leveling.

```typescript
interface XPOptions {
  messageXP: {
    min: number;
    max: number;
    cooldown: number;
  };
  voiceXP: {
    perMinute: number;
    minActivity: number;
  };
}

class XPHandler {
  static addXP(userId: string, amount: number): Promise<void>;
  static removeXP(userId: string, amount: number): Promise<void>;
  static calculateLevel(xp: number): number;
  static getLeaderboard(guildId: string, page: number): Promise<User[]>;
}
```

### MusicHandler

Handles music playback and queue management.

```typescript
interface Song {
  name: string;
  url: string;
  duration: number;
  formattedDuration: string;
}

interface Queue {
  songs: Song[];
  volume: number;
  playing: boolean;
  repeatMode: boolean;
  currentTime: number;
}

class MusicHandler {
  static play(voiceChannel: VoiceChannel, query: string): Promise<void>;
  static skip(guildId: string): Promise<void>;
  static stop(guildId: string): Promise<void>;
  static setVolume(guildId: string, volume: number): Promise<void>;
  static getQueue(guild: Guild): Queue;
}
```

## Models

### User Model

```typescript
interface IUser {
  userId: string;
  guildId: string;
  xp: number;
  level: number;
  messages: number;
  voiceTime: number;
  warnings: Array<{
    reason: string;
    moderator: string;
    timestamp: Date;
  }>;
}

class User {
  static findOne(query: object): Promise<IUser>;
  static updateXP(userId: string, amount: number): Promise<void>;
  static addWarning(userId: string, warning: object): Promise<void>;
  static getStats(userId: string): Promise<object>;
}
```

### Guild Model

```typescript
interface IGuild {
  guildId: string;
  prefix: string;
  automod: {
    enabled: boolean;
    filters: string[];
    ignoredChannels: string[];
    ignoredRoles: string[];
  };
  leveling: {
    enabled: boolean;
    announceChannel: string;
    roles: Map<number, string>;
  };
}

class Guild {
  static findOne(query: object): Promise<IGuild>;
  static updateSettings(guildId: string, settings: object): Promise<void>;
  static getConfig(guildId: string): Promise<object>;
}
```

## Events

### Event Handling

```typescript
interface Event {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}

class EventHandler {
  static registerEvent(event: Event): void;
  static removeEvent(name: string): void;
}
```

## Utils

### Configuration

```typescript
class Config {
  static get(key: string): any;
  static set(key: string, value: any): void;
  static load(): Promise<void>;
  static save(): Promise<void>;
}
```

### Security

```typescript
class Security {
  static checkPermissions(member: GuildMember, permissions: string[]): boolean;
  static validateInput(input: string): boolean;
  static sanitize(content: string): string;
}
```

## Examples

See the `examples` directory for practical usage examples:
- `automod.js`: Custom AutoMod filter implementation
- `leveling.js`: Custom leveling system with rewards
- `music.js`: Advanced music player with progress bar
