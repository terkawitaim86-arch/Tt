const fields = [
  'title',
  'description',
  'author',
  'color',
  'footer',
  'thumbnail',
  'image'
];

function getData() {
  const data = {};

  fields.forEach(key => {
    data[key] = document.getElementById(key).value;
  });

  return data;
}

function updatePreview() {
  const data = getData();

  document.getElementById('previewTitle').textContent =
    data.title || 'Your title appears here';

  document.getElementById('previewDescription').textContent =
    data.description || 'Your embed description will appear here.';

  document.getElementById('previewAuthor').textContent =
    data.author;

  document.getElementById('previewFooter').textContent =
    data.footer;

  document.getElementById('preview').style.borderLeftColor =
    data.color;

  document.getElementById('colorValue').textContent =
    data.color.toUpperCase();

  const thumbnail = document.getElementById('previewThumbnail');
  const image = document.getElementById('previewImage');

  thumbnail.hidden = !data.thumbnail;
  image.hidden = !data.image;

  thumbnail.src = data.thumbnail || '';
  image.src = data.image || '';
}

fields.forEach(key => {
  document.getElementById(key).addEventListener(
    'input',
    updatePreview
  );
});

document.getElementById('clear').addEventListener('click', () => {
  fields.forEach(key => {
    const element = document.getElementById(key);

    if (key === 'color') {
      element.value = '#5865F2';
    } else {
      element.value = '';
    }
  });

  updatePreview();
});

document.getElementById('copy').addEventListener('click', async () => {
  const data = getData();

  const json = {
    title: data.title,
    description: data.description,
    color: data.color,
    author: data.author,
    footer: data.footer,
    thumbnail: data.thumbnail,
    image: data.image
  };

  try {
    await navigator.clipboard.writeText(
      JSON.stringify(json, null, 2)
    );

    alert('Embed JSON copied!');
  } catch {
    alert('Could not copy JSON.');
  }
});

updatePreview();