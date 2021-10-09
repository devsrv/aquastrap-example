<div>
    <h3>Post Component</h3>
    <p>{{ $comment }}</p>

    <button type="button" onclick="@aqua.delete({comment: '{{ $comment }}'}).then(res => console.log('Post Component', res))">Fetch</button>
    <button type="button" onclick="@aqua.delete({comment: '{{ $comment }}'}).then(res => console.log('Post Component', res))">Fetch</button>
    <button type="button" onclick="@aqua.delete({comment: '{{ $comment }}'}).then(res => console.log('Post Component', res))">Fetch</button>

    <hr>
    <button type="button" onclick="rqst().delPost()">Attempt</button>
    <button type="button" class="btn btn-sm btn-light" onclick="rqst().reset()">reset statusCode</button>
    <script>
        function rqst() {
            return {
                hook: @aqua.hook.delete,
                delPost() {
                    this.hook.observe((state) => {
                        console.log(state.statusCode, 'local nx observe');
                    });

                    this.hook.submit();
                },
                reset() {
                    this.hook.resetState('statusCode');
                }
            };
        }
    </script>
</div>
