#!/usr/bin/env bash
# scripts/process-music.sh — конвертация flac → ogg с кроссфейд-лупом и LUFS-нормализацией.
#
# Использование:
#   bash scripts/process-music.sh            # обработать все .flac в src/assets/music/
#   bash scripts/process-music.sh title.flac  # только указанный файл
#
# Требования: ffmpeg в PATH.
#
# Обработка:
#   1. обрезка тишины по краям
#   2. кроссфейд последних 3 секунд на первые 3 — бесшовный луп
#   3. ogg/libvorbis, q:a 4, 44100 Hz
#   4. LUFS-нормализация: I=-23, LRA=7, TP=-2

set -e

DIR="$(cd "$(dirname "$0")/.." && pwd)/src/assets/music"
cd "$DIR"

FILES=("$@")
if [[ ${#FILES[@]} -eq 0 ]]; then
  # все flac, кроме скрытых
  shopt -s nullglob
  FILES=(*.flac)
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "Нет .flac файлов в $DIR"
  exit 1
fi

TMPDIR="/tmp/chess-music-$$"
mkdir -p "$TMPDIR"
trap "rm -rf '$TMPDIR'" EXIT

for flac in "${FILES[@]}"; do
  base="${flac%.flac}"
  out="${base}.ogg"
  echo "→ $base"

  raw="$TMPDIR/${base}-raw.wav"
  trimmed="$TMPDIR/${base}-trimmed.wav"
  looped="$TMPDIR/${base}-looped.wav"

  # 1. Обрезать тишину по краям
  ffmpeg -y -i "$flac" -af \
    "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1,\
     areverse,\
     silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1,\
     areverse" \
    "$trimmed"

  # 2. Кроссфейд последних 3 секунд на первые 3
  ffmpeg -y -i "$trimmed" -filter_complex \
    "[0:a]atrim=0:3,afade=t=in:d=3[head]; \
     [0:a]atrim=3,asetpts=PTS-STARTPTS[body]; \
     [0:a]areverse,atrim=0:3,areverse,afade=t=out:d=3[tail]; \
     [tail][head]amix=inputs=2:duration=shortest[mixed]; \
     [body][mixed]concat=n=2:v=0:a=1" \
    "$looped"

  # 3. ogg + LUFS-нормализация
  ffmpeg -y -i "$looped" -c:a libvorbis -q:a 4 -ar 44100 \
    -af "loudnorm=I=-23:LRA=7:TP=-2" \
    "$out"

  echo "  ✓ $out"
done

echo "Готово: ${#FILES[@]} файлов → $DIR"