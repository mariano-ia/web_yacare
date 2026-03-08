import imageio.v3 as iio

# Read video
frames = iio.imread('public/assets/videos/sameco_animation.mp4', plugin='pyav')

# Save as gif
iio.imwrite('public/assets/videos/sameco_animation.gif', frames, extension='.gif', fps=15)
print("GIF created successfully!")
