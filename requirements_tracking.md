> [!NOTE]
> This document tracks the implementation status of the Video Wall requirements.
> **Status Legend:**
>
> - ✅ **Done**: Fully implemented and working.
> - ⚠️ **Partial**: Partially implemented or hardcoded (needs expansion).
> - 🔴 **To Do**: Not yet implemented.

## 1. Configuration (Operator)

| Ref | Requirement                                                  | Priority | Status     | Notes                                                                                                             |
| :-- | :----------------------------------------------------------- | :------- | :--------- | :---------------------------------------------------------------------------------------------------------------- |
| 1.1 | Set number of videos displayed (manage bandwidth/processing) | High     | ✅ Done    | Dynamic sizing (rows/cols) implemented in App.tsx.                                                                |
| 1.2 | Set 2x2, 4x3, 6x4 configurations                             | High     | ✅ Done    | Presets available in Control Panel.                                                                               |
| 1.3 | Set border colour around video wall                          | High     | 🔴 To Do   | Styling is currently static CSS.                                                                                  |
| 1.4 | Separate control screen (for dual screen setups)             | High     | ⚠️ Partial | Control panel exists as a sidebar. Multi-window support not verified.                                             |
| 1.5 | Set fade in/out length (tenths of seconds)                   | Low      | 🔴 To Do   |                                                                                                                   |
| 1.6 | Set start/end points for each video                          | Low      | 🔴 To Do   |                                                                                                                   |
| 1.7 | Defaults: Fade=0s, Start=0:00, End=Full                      | Low      | 🔴 To Do   | implicit default is 0/Full, but no explicit settings.                                                             |
| 1.8 | Auto-start vs Manual start options                           | Medium   | ⚠️ Partial | Videos default to paused or require "Play" click. Auto-play logic exists in sync hooks but needs specific config. |
| 1.9 | Define sync/async gap per video                              | Medium   | 🔴 To Do   |                                                                                                                   |

## 2. Appearance (Watcher)

| Ref | Requirement                                 | Priority | Status     | Notes                                                |
| :-- | :------------------------------------------ | :------- | :--------- | :--------------------------------------------------- |
| 2.1 | Video wall without windows/controls visible | High     | ✅ Done    | Main video area is separate from sidebar.            |
| 2.2 | Single border colour around video wall      | High     | ⚠️ Partial | CSS styling exists but is not user-customizable yet. |
| 2.3 | Watch videos in synchronized way            | High     | ✅ Done    | Core feature (Local & YouTube sync) implemented.     |
| 2.4 | Maximize space on wall (2x2 etc)            | High     | ✅ Done    | Layout fills availability.                           |
| 2.5 | Cross-fade support                          | Low      | 🔴 To Do   |                                                      |

## 4. Play Queue (Operator)

| Ref | Requirement                                             | Priority | Status     | Notes                                                               |
| :-- | :------------------------------------------------------ | :------- | :--------- | :------------------------------------------------------------------ |
| 4.1 | Enter link to video (local/online) to queue             | High     | ⚠️ Partial | Can load single Local File or YouTube ID. Queueing not implemented. |
| 4.2 | Add video into play queue (while playing)               | Medium   | 🔴 To Do   |                                                                     |
| 4.3 | Queue capacity up to 15 videos                          | Medium   | 🔴 To Do   |                                                                     |
| 4.4 | See currently playing video vs queue                    | High     | ⚠️ Partial | Current video is visible. Queue is not.                             |
| 4.5 | Re-order play queue                                     | Medium   | 🔴 To Do   |                                                                     |
| 4.6 | View play queue list (sorted)                           | Medium   | 🔴 To Do   |                                                                     |
| 4.7 | Remove capabilities (auto-remove played, manual delete) | Medium   | 🔴 To Do   |                                                                     |

## 5. Play Control (Operator)

| Ref | Requirement                         | Priority | Status     | Notes                                             |
| :-- | :---------------------------------- | :------- | :--------- | :------------------------------------------------ |
| 5.1 | Play next automatically or manually | High     | 🔴 To Do   | Requires Queue implementation.                    |
| 5.2 | Pause, restart, skip forward        | Medium   | ⚠️ Partial | Pause/Play works. Skip/Restart not fully exposed. |
| 5.3 | Perfect 0ms sync delay              | High     | ✅ Done    | Sync engine implemented for this specific goal.   |
| 5.4 | Asynchronous gaps (100ms-500ms)     | High     | 🔴 To Do   |                                                   |

## 6. Play History (Operator)

| Ref | Requirement                     | Priority | Status   | Notes |
| :-- | :------------------------------ | :------- | :------- | :---- |
| 6.1 | Retain history between sessions | Low      | 🔴 To Do |       |
| 6.2 | Delete from history             | Low      | 🔴 To Do |       |
| 6.3 | Sort history                    | Low      | 🔴 To Do |       |
| 6.4 | Search history                  | Low      | 🔴 To Do |       |
| 6.5 | Smart text search               | Low      | 🔴 To Do |       |
| 6.6 | Retain settings in history      | Low      | 🔴 To Do |       |

## 7. Play Operation (Operator)

| Ref | Requirement                        | Priority | Status   | Notes           |
| :-- | :--------------------------------- | :------- | :------- | :-------------- |
| 7.1 | Buffer next video for instant play | High     | 🔴 To Do | Requires Queue. |

---

### Implementation Progress Summary

- **Core Sync Engine**: ✅ Implemented for both Local and YouTube.
- **Basic Playback**: ✅ Implemented.
- **Control Interface**: ⚠️ Basic version implemented (Sidebar).
- **Play Queue System**: 🔴 Major missing component.
- **Configuration/Refinement**: 🔴 Mostly missing (Grid size, Borders, Fades).
