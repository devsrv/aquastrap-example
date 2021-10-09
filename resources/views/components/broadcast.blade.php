<div class="d-flex">
    <select id="preference-{{ $id }}" class="form-control mr-2">
        <option value="YT">Youtube</option>
        <option value="Laracasts">Laracasts</option>
        <option value="Teachable">Teachable</option>
    </select>
    <small id="pref-msg-{{ $id }}" class="small text-danger"></small>

    <button type="button" onclick="saveBroadcastPreference(@aqua.hook.store, this, {{ $id }})" class="btn btn-info btn-sm">Save</button>
</div>

@push('scripts')
@once
    <script>
        function saveBroadcastPreference(hook, button, id) {
            const preference = document.getElementById(`preference-${id}`);
            const preferenceMsg = document.getElementById(`pref-msg-${id}`);

            hook.post({preference: preference.value});

            hook.observe((state) => {
                if(state.processing) {
                    button.setAttribute('disabled', 'disabled');
                    preference.setAttribute('disabled', 'disabled');
                    preferenceMsg.innerText = '';
                }

                if(! state.processing) {
                    button.removeAttribute('disabled');
                    preference.removeAttribute('disabled');

                    if(state.statusCode) {
                        preferenceMsg.innerText = state.statusCode;
                        preferenceMsg.innerText += ' ' + state.message;
                    }
                }
            });
        }
    </script>
@endonce
@endpush
