<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Aqua\Aquastrap\Traits\AquaSync;
use Aqua\Aquastrap\AquaComponent;

class Post extends AquaComponent
{
    use AquaSync;

    // protected static $middlewares = ['auth'];
    protected static $guarded = ['store'];
    // protected static $aquaCallable = ['delete'];

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct(public $username, public $comment = '', public $foo = null)
    {

    }

    public function delete()
    {
        return $this->success('success message')->setStatusCode(204);
    }

    public function store()
    {
        return $this->success('success message');
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.post', ['foo' => 'bar']);
        // return view('components.post', ['foo' => 'bar'])->with($this->aquaRecipes());
    }
}
