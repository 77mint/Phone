export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return Response.json({ ok: false, error: '未收到图片文件' }, { status: 400 });
    }

    const outForm = new FormData();
    outForm.append('reqtype', 'fileupload');
    outForm.append('fileToUpload', file, file.name || 'image.jpg');

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: outForm
    });

    const text = (await res.text()).trim();
    if (!res.ok || !text.startsWith('http')) {
      return Response.json(
        { ok: false, error: text || '公共图床暂时无响应，请稍后重试' },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, url: text });
  } catch (err) {
    return Response.json(
      { ok: false, error: (err && err.message) ? err.message : '上传失败' },
      { status: 500 }
    );
  }
}
