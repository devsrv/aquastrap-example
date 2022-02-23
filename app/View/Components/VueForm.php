<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Aqua\Aquastrap\Traits\AquaSync;
use Aqua\Aquastrap\AquaComponent;
use Illuminate\Http\Request;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

class VueForm extends AquaComponent
{
    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    public function allowed() : Response
    {
        // return true;
        // Gate::authorize('update-post');
        // return Response::deny('You must be an administrator.');
        return Response::allow();
    }

    public function store(Request $request)
    {
        sleep(1);
        $this->rateLimit(2);

        $request->validate([
            'comment' => 'required|min:10'
        ]);

        return $this->success('success message')
        ->setContent([
            'message' => 'hello world'
        ]);;
    }

    public function publish(Request $request)
    {
        sleep(1);

        $request->validate([
            'comment' => 'required|min:10'
        ]);

        return $this->success('success message')
        ->setContent([
            'success' => 1, 'id' => 10
        ]);;
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.vue-form');
    }
}
