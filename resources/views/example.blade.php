@extends('welcome')

@section('content')
<div class="justify-content-center mt-5 mx-5">
    <div class="container">
        <div class="row">
            <div class="col-4">
                <x-article />
            </div>
            <div class="col-4">
                {{-- <x-folder.my-component fname="rv" username="rav" :aCallableArg="function($param) { return $param; }" /> --}}

                <x-wrapper wrap="div.row>div.col-6>div.card.p-2>div.card-body>div.form-group[title='Hello world']>span.bg-info+p#rav>p">
                    <x-form.text class="form-control-sm" />
                </x-wrapper>
            </div>
            <div class="col-4">
                <x-post username="rsourav" comment="test comment" foo="bar" />
                <x-post username="avish" comment="shiva" />
                <hr>
                <x-vue-form />
            </div>
        </div>
    </div>

</div>
@endsection
