<div>
    <h3>Post Component</h3>
    <p>{{ $comment }}</p>

    <button type="button" onclick="@aqua.delete({comment: '{{ $comment }}'}).then(res => console.log('Post Component', res))">Fetch</button>
</div>
