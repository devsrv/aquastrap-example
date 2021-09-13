<div class="row">
    @verbatim
    <div class="card">
        <div class="card-body" id="vapp">
            <h2>Using Promise</h2>
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
    </div>

    <div class="card mt-3">
        <div class="card-body mt-4" id="v-hook-app">
            <h2>Hook</h2>

            <p class="mb-0 text-danger" v-if="aquahook.state.hasValidationError">validation error!</p>
            <p class="mb-2">{{ aquahook.state.message }}</p>

            <p>Commented: <em class="font-italic text-primary">{{ form.comment }}</em></p>

            <form @submit.prevent="aquahook.submit(form)"> <!-- or using @submit.prevent="store" -->
                <textarea v-model="form.comment" :disabled="aquahook.state.processing" type="text" class="form-control form-control-sm" :class="{'is-invalid': aquahook.state.errors.comment}"></textarea>
                <small class="invalid-feedback">{{ aquahook.state.errors.comment && aquahook.state.errors.comment[0] }}</small>

                <button :disabled="aquahook.state.processing" type="submit" class="btn btn-sm btn-dark mt-1 d-flex justify-content-center">
                    <div v-if="aquahook.state.processing" class="spinner-grow spinner-grow-sm align-self-center mr-2" role="status"></div>
                    {{ ( aquahook.state.processing ? 'Saving...' : 'Save' ) }}
                </button>
                <span v-if="! aquahook.state.processing && aquahook.state.statusCode == 200" class="text-success">saved !</span>
            </form>
        </div>
    </div>

    <div class="card mt-3">
        <div class="card-body mt-4" id="v-hook-app2">
            <h2>Hook 2</h2>

            <small class="mb-0 text-danger" v-if="hasValidationErrors">validation error!</small>
            <p class="mb-2">{{ state.message }}</p>

            <p class="mb-2 text-success">{{ postSuccessMsg }}</p>

            <p>Commented: <em class="font-italic text-primary">{{ form.comment }}</em></p>

            <form @submit.prevent="post(form)">
                <textarea v-model="form.comment" :disabled="state.processing" type="text" class="form-control form-control-sm" :class="{'is-invalid': state.errors.comment}"></textarea>
                <small class="invalid-feedback">{{ state.errors.comment && state.errors.comment[0] }}</small>

                <button :disabled="state.processing" type="submit" class="btn btn-sm btn-dark mt-1 d-flex justify-content-center">
                    <div v-if="state.processing" class="spinner-grow spinner-grow-sm align-self-center mr-2" role="status"></div>
                    {{ ( state.processing ? 'Saving...' : 'Save' ) }}
                </button>
            </form>
        </div>
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

    const vmhook = new Vue({
        el: '#v-hook-app',
        data: {form: {comment: ''}, aquahook: @aqua.hook.store},
        methods: {
            store: function() {
                this.aquahook.submit(this.form);
            },
        }
    });

    const vmhook2 = new Vue({
        el: '#v-hook-app2',
        data: {form: {comment: ''}, postSuccessMsg: '', ...@aqua.hook.publish},
        computed: {
            hasValidationErrors: function () {
                return ! this.state.processing && Object.keys(this.state.errors).length > 0;
            }
        },
        watch: {
            result: function (response) {
                // listen for result & do anything
                if(response && Object.prototype.hasOwnProperty.call(response, 'success') && Number(response.success) === 1) this.postSuccessMsg = 'comment posted for post ' + response?.id;
            },
            processing: function (running) {
                // reset data
                if(running) this.postSuccessMsg = '';
                if(! running && this.state.statusCode == 200) this.form.comment = '';
            },
        }
    });
</script>
