<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Devsrv\Aquastrap\Traits\ExposeMethods;
use Illuminate\Routing\Router;

class Article extends Component
{
    use ExposeMethods;

    // public const SKIP_ROUTES = ['delete'];
    public const SKIP_ROUTES = [];

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct()
    {
        // $this->middleware('auth');
        // $this->middleware('auth')->except('foo');
        // $this->middleware('log')->only('index');
        // $this->middleware('subscribed')->except('store');
    }

    public static function routes(Router $router)
    {
        $router->get('articles/foo/update', [static::class, 'update'])->name('test.name');
        $router->post('articles/foo/delete', [static::class, 'delete'])->name('test.delete');
    }

    public function update()
    {
        return response()->json(['foo' => 'bar']);
    }

    public function delete()
    {
        // sleep(5);
        return response()->json(['foo' => 'bar']);
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.article');
    }
}
