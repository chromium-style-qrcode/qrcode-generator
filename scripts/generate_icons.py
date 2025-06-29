#!/usr/bin/env python3

import os
from PIL import Image, ImageDraw
import argparse

def draw_qr_icon(size):
  img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
  draw = ImageDraw.Draw(img)

  scale = size / 18.0

  def scale_coord(coord):
    return int(coord * scale)

  def scale_rect(x, y, w, h):
    return (scale_coord(x), scale_coord(y),
            scale_coord(x + w), scale_coord(y + h))

  fill_color = (0, 0, 0, 255)

  outer_rect = scale_rect(1, 1, 16, 16)

  draw.rounded_rectangle(outer_rect, radius=scale_coord(2), fill=fill_color)

  inner_rect = scale_rect(2, 2, 14, 14)
  draw.rounded_rectangle(inner_rect, radius=scale_coord(1.72), fill=(0, 0, 0, 0))

  v_rect = scale_rect(7.4, 0, 3.2, 18)
  draw.rectangle(v_rect, fill=(0, 0, 0, 0))

  h_rect = scale_rect(0, 7.4, 18, 3.2)
  draw.rectangle(h_rect, fill=(0, 0, 0, 0))

  tl_rect = scale_rect(3.8, 3.8, 4.5, 4.5)
  draw.rounded_rectangle(tl_rect, radius=scale_coord(0.9), fill=fill_color)

  tr_rect = scale_rect(9.7, 3.8, 4.5, 4.5)
  draw.rounded_rectangle(tr_rect, radius=scale_coord(0.9), fill=fill_color)

  bl_rect = scale_rect(3.8, 9.7, 4.5, 4.5)
  draw.rounded_rectangle(bl_rect, radius=scale_coord(0.9), fill=fill_color)

  br_rect = scale_rect(9.7, 9.7, 4.5, 4.5)
  draw.rounded_rectangle(br_rect, radius=scale_coord(0.9), fill=fill_color)

  return img

def main():
  parser = argparse.ArgumentParser(description='Generate QR code icons in different sizes as PNG files')
  parser.add_argument('-o', '--output', default='./public/icon',
                  help='output directory (default: ./public/icon)')
  args = parser.parse_args()

  os.makedirs(args.output, exist_ok=True)

  sizes = [16, 32, 48, 96, 128]

  for size in sizes:
    icon = draw_qr_icon(size)
    output_path = os.path.join(args.output, f'{size}.png')
    icon.save(output_path, 'PNG')
    print(f'Generated icon: {output_path} ({size}x{size})')

  print(f'\n✅ Successfully generated {len(sizes)} sizes of QR code icons')
  print(f'Output directory: {os.path.abspath(args.output)}')

if __name__ == '__main__':
  main()
