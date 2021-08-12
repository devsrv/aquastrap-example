<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Devsrv\Aquastrap\Traits\AquaSync;

class Profile
{
    use AquaSync;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct(public $comment = '', public $foo = null)
    {
        // $this->middleware('auth');
    }

    public function updated()
    {
        return $this->success('success update message', [
            'comment' => $this->comment
        ]);
    }

    public function deleted()
    {
        return $this->success('success delete message', ['hello' => 'world']);
    }

    public function store()
    {
        return $this->success('success delete message', ['hello' => 'world']);
    }

    public function render()
    {
        // $this->aquaRecipes()
        return view('profile', ['comment' => 'bar'])->with($this->aquaRecipes());
        // return view('profile', ['comment' => 'bar']);
    }
}
