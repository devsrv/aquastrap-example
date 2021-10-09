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

                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <ul class="list-group">
                                <li class="list-group-item">
                                    <x-game user="1" />
                                </li>
                                <li class="list-group-item">
                                    <x-game user="2" />
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col-12 mt-3">
                        <div class="card">
                            <ul class="list-group">
                                <li class="list-group-item">
                                    <x-broadcast id="1" />
                                </li>
                                <li class="list-group-item">
                                    <x-broadcast id="2" />
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
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
