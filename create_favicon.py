from PIL import Image, ImageDraw
import os


def create_favicon(size, filename):
    # Create image with black background
    img = Image.new("RGBA", (size, size), (10, 10, 10, 255))
    draw = ImageDraw.Draw(img)

    # Calculate proportional dimensions
    border_offset = max(1, size // 16)
    line_width = max(2, size // 8)
    letter_margin = max(4, size // 5)

    # Draw glowing border (green)
    border_color = (0, 255, 0, 200)
    draw.rectangle(
        [
            border_offset,
            border_offset,
            size - border_offset - 1,
            size - border_offset - 1,
        ],
        outline=border_color,
        width=border_offset,
    )

    # Draw Z letter
    z_color = (0, 255, 0, 255)
    # Top line
    draw.line(
        [letter_margin, letter_margin, size - letter_margin, letter_margin],
        fill=z_color,
        width=line_width,
    )
    # Diagonal
    draw.line(
        [size - letter_margin, letter_margin, letter_margin, size - letter_margin],
        fill=z_color,
        width=line_width,
    )
    # Bottom line
    draw.line(
        [
            letter_margin,
            size - letter_margin,
            size - letter_margin,
            size - letter_margin,
        ],
        fill=z_color,
        width=line_width,
    )

    img.save(filename, "PNG")
    print(f"Created {filename}")


if __name__ == "__main__":
    # Create different sizes
    create_favicon(16, "favicon-16x16.png")
    create_favicon(32, "favicon-32x32.png")
    create_favicon(180, "apple-touch-icon.png")

    # Convert 32x32 PNG to ICO format for better compatibility
    if os.path.exists("favicon-32x32.png"):
        img = Image.open("favicon-32x32.png")
        img.save("favicon.ico", format="ICO", sizes=[(32, 32), (16, 16)])
        print("Created favicon.ico")

    print("All favicon files created successfully!")
