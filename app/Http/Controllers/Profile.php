<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Devsrv\Aquastrap\Traits\AquaSync;

class Profile extends Controller
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

    public function update()
    {
        return $this->success('success update message');
    }

    public function delete()
    {
        return $this->success('success delete message', ['hello' => 'world']);
    }

    public function render()
    {
        return view('profile', ['comment' => 'bar'])->with($this->aquaRecipes());
    }
}
