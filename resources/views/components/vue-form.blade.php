<div class="card">
    @verbatim
    <div class="card-body" id="vapp">
        <p>Commented: <em class="font-italic text-primary">{{ comment }}</em></p>

        <form @submit.prevent="submit">
            <textarea v-model="comment" :disabled="processing" type="text" class="form-control form-control-sm" :class="{'is-invalid': errors.comment}"></textarea>
            <small class="invalid-feedback">{{ errors.comment && errors.comment[0] }}</small>

            <button :disabled="processing" type="submit" class="btn btn-sm btn-dark mt-1 d-flex justify-content-center">
                <div v-if="processing" class="spinner-grow spinner-grow-sm align-self-center mr-2" role="status"></div>
                {{ ( processing ? 'Saving...' : 'Save' ) }}
            </button>
            <span v-if="! processing && status.toString().startsWith('2')" class="text-success">saved !</span>
        </form>
    </div>
    @endverbatim
</div>

<script>
    const vm = new Vue({
        el: '#vapp',
        data: {processing: false, comment: '', errors: {}, status: ''},
        methods: {
            submit: function () {
                this.processing = true;
                this.errors = {};

                @aqua.store({comment: this.comment})
                .then(({status, data}) => {
                    this.status = status;

                    if(status === 422) {
                        const {message, errors} = data;

                        this.errors = errors;
                        return;
                    }

                    this.comment = '';
                })
                .finally(_ => this.processing = false);
            }
        }
    });
</script>
