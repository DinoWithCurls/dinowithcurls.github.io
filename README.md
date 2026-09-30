# dinowithcurls.github.io

The personal site of Aditya Raj Singh, built as a small Linux desktop: a Hyprland-style tiling
window manager full of terminal windows, in Gruvbox colours and JetBrains Mono. Each window runs
a command and prints its output. Windows can be dragged, swapped, resized and opened. The first
one is a working shell.

React + TypeScript + Vite, with Framer Motion for animation. Deployed to GitHub Pages by
GitHub Actions.

## Using it

- **Click** a window (or a role in `~/work`) to open it as a floating window. Close it with
  `[x]`, Esc, or a click outside.
- **Drag a window by its title bar** (or alt + drag anywhere in it) over another window. The
  other window slides into your window's old slot straight away, and a dashed outline shows
  where yours will land. Let go to drop it there, drag back over the moved window to undo, or
  press Esc to cancel.
- **Drag the gap between two windows** to resize them. Double-click the gap to even it out.
- **Keyboard:** hjkl or the arrow keys move focus between windows, shift + hjkl swaps the
  focused window with its neighbour, Enter opens it, and `/` jumps to the prompt.
- **The bar** shows the title of the window in focus, the time in Hyderabad, and links.
- **Shell:** type `help`. It knows `about`, `work`, `projects`, `skills`, `open <name>`, `cv`,
  `reset`, `email`, `github`, `linkedin` and `clear`, with Tab completion and history on ↑.
- **TypeDuel:** press `[ race the ghost ]` and type the passage. Esc goes back.

Nothing is saved. A reload puts every window back.

On a phone the windows stack in one column and scroll. Dragging and resizing switch off there.
With Reduce Motion on, everything appears already printed and nothing loops.

## Develop

```bash
npm install
npm run dev              # dev server on http://localhost:5173
npm run build            # typecheck + production build to dist/
npm run lint
npm run test:animations  # with the dev server running; see "Testing the animation" below
```

## Where things are

```
src/
  App.tsx                    motion settings + the desktop
  content.ts                 all the copy: roles, projects, skills, the Workouter run
  skillUsage.ts              "where I used it" for each tool, worked out from content.ts
  terminal/
    TerminalHome.tsx         the desktop: layout state, drag/resize/keyboard wiring, the windows
    tiling.ts                where windows sit, titles, neighbours, the slot under the pointer
    Win.tsx                  one tiled window: drag, drop, resize, and Flip (the fly-in)
    Float.tsx                the floating window a tile opens into
    Shell.tsx                the prompt in the first window
    Bar.tsx                  the top bar: focused window's title, clock, links
    print.tsx, timing.ts     boot pop-in, typed commands, line-by-line output
    shared.ts                small shared values (radius, animation timings)
  components/
    WorkouterDemo.tsx        replay of a real agent run
    TypeDuelDemo.tsx         replayed race, and a race you can play
    Tag.tsx, icons.tsx       tool names with their icons, link icons
  motion/                    follows the OS Reduce Motion setting
  styles/terminal.css        everything visual
scripts/animation-test.mjs   the animation test
```

## How it works

### The tiling

The layout is data: `rows`, three lists of window ids, and `spans`, how wide each window is out
of 240 grid columns. Each window gets its grid row, start column and span from that state, so
swapping two windows is swapping two ids, and resizing is moving columns between neighbours. The
fine 240-column grid is what lets a dragged gap move smoothly instead of in big steps.

All windows stay children of the same parent however they move, so React never remounts them:
the shell keeps its history and the demos keep running.

### Dragging, dropping, and the fly-in (`Win.tsx`)

Dragging is our own pointer handling, not a library. While you drag, the window's `x`/`y`
follow the pointer exactly. When the pointer crosses into another window's slot, the layout is
swapped right then, which is the live preview.

Every slot change animates with **FLIP** (first, last, invert, play), in the `Flip` component:

1. remember where the window was laid out;
2. after the change, measure where it is laid out now;
3. set `x`/`y` so it still appears where it was;
4. animate `x`/`y` back to 0, so it flies to its new place.

The same code handles the window that moved aside, a keyboard swap, `reset`, and the drop.
While a window is being dragged, a slot change does not fly it. The drag's anchor point moves
instead, so it stays under the pointer.

Two details that matter:

- **Hit-testing uses layout positions, not what is on screen.** A window sliding out of the way
  is still drawn under the pointer for a moment. Testing against what is drawn would swap it
  straight back.
- **`Flip` finds its window through a hidden probe element.** A child's layout effect runs
  before its parent's ref is attached, so on the first render a ref to the window would still
  be empty and the first swap would have nothing to fly from.

HTML5 drag-and-drop was not used because it drags a snapshot image, not the window, with no
control over the drop. dnd-kit is built around sortable lists. Tiles of different sizes on a grid
would still need a hand-written landing, so the custom code is shorter.

### The floating window (`Float.tsx`)

When a window opens, the floating window's frame starts on the exact rectangle of what was
clicked and animates `left/top/width/height` to its full size. The content fades in after. On
close it shrinks back to wherever that thing is by then, even if it was moved while the window
was open.

This used to be Framer Motion's shared layout (`layoutId`), which is simpler to write. But every
window background then re-measured itself one frame late on every move. While resizing, the frame
trailed the text by a step on every frame, and on a swap it drew once in the wrong place. Doing
it by hand keeps the tiled windows plain elements that move in one piece.

### Printing (`print.tsx`, `timing.ts`)

On load, each window pops in after the one before it (each has a fixed boot order, wherever it
has been moved). Then its command types itself out, and its output fades in line by line. The
output is rendered from the start, just invisible, so nothing reflows as it appears. Typing waits
for the web font, so it never starts with the fallback font's letter widths.

### The shell (`Shell.tsx`)

A small command table. Commands print output into the first window, open floating windows,
open the CV, or reset the layout. The window scrolls inside itself, so typing never changes
the size of the desktop.

### The bar (`Bar.tsx`)

Like waybar on Hyprland: the focused window's title on the left, the time in Hyderabad in the
middle, links on the right.

### Narrow windows

Every window is a CSS container (`container-type: inline-size`), so its text adapts to the
window's own width, not the screen's:

- the name scales down;
- `built.md` drops its last column;
- dates move to the next line;
- the budget meter and the race lanes are flexible bars;
- the Workouter plan is a grid whose names wrap while sets, reps and kg stay put.

A window can't be resized below 340px wide on any screen. The first window scrolls inside
itself, so shell output never resizes the desktop. Its minimum height is measured from its
boot text, so squeezing it never hides that text.

### The project demos (`components/`)

- **Workouter** replays one real run of the planning agent, week 5 day 1 (the data is in
  `content.ts`).
  - A budget meter fills for each request: Groq's 8k-token gate on prompt plus reserved output.
  - A spinner waits on the model, and the `submit_day` tool call streams in.
  - The validator sends back a warning, the second attempt is accepted, and the planned day
    prints as a table.
  - It all scrolls through a fixed-height viewport, like a terminal, so the window never grows.
- **TypeDuel** shows a demo of a two-player race in a WebSocket room: a lane and live WPM for
  each player, both carets on the passage, and one typo made and fixed. It is scripted, not a
  recording, and labelled "demo". `[ race the ghost ]`
  turns it into the real thing: a hidden input takes your typing, the ghost types at 45 wpm,
  and you get your WPM and accuracy at the end.

Both only loop while on screen, and start once their window's command has finished typing.

## Testing the animation

`scripts/animation-test.mjs` drives headless Chrome through its DevTools protocol, using Node's
built-in WebSocket, so it needs no packages. With the dev server running, it:

- drags a window onto another with real mouse events, then drops it;
- drags a gap to resize two windows;
- opens and closes a floating window.

While it does that, the page records every window's box, background and text on every animation
frame. It then reports:

- the frame rate;
- how far any background or text ever drifted from its window (it should be 0px);
- each window's path after the drop;
- whether the floating window starts on the tile and shrinks back onto it.

Pass `shots` to also save screenshots. They are kept out of the measuring run, because taking
one pauses rendering.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to
GitHub Pages. The repo's **Settings → Pages → Source** must be **GitHub Actions**.

The earlier Start Bootstrap site is kept in `old/`.
