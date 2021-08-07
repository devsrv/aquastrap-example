<?php

namespace App\View\Components;

use Illuminate\Support\Str;
use Illuminate\View\Component;

class Wrapper extends Component
{
    public $dom;
    public $wrap;
    public $lastElement;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($wrap)
    {
        $this->dom = new \DOMDocument();
        $this->wrap = $wrap;
    }

    public function appendHTML(\DOMNode $parent, $source) {
        $tmpDoc = new \DOMDocument();
        $tmpDoc->loadHTML($source);
        foreach ($tmpDoc->getElementsByTagName('body')->item(0)->childNodes as $node) {
            $node = $parent->ownerDocument->importNode($node, true);
            $parent->appendChild($node);
        }
    }

    public function withMarkup(string $slotContent) : string
    {
        $parts = explode('>', $this->wrap);

        foreach ($parts as $part) {
            if (Str::contains($part, '+')) {
                $siblings = explode('+', $part);

                $first = true;
                foreach ($siblings as $sibling) {
                    if($this->lastElement) {
                        $element = $this->makeElement($sibling);

                        if($first) {
                            $this->lastElement->appendChild($element);
                        }
                        else {
                            $appendTo = $this->lastElement?->parentNode ?: $this->dom;
                            $appendTo->appendChild($element);
                        }

                        $this->lastElement = $element;
                    }

                    $first = false;
                }

                $this->lastElement = $this->lastElement?->parentNode ?:  $this->dom;

                continue;
            }

            $element = $this->makeElement($part);
            $appendTo = $this->lastElement ?: $this->dom;
            $appendTo->appendChild($element);

            $this->lastElement = $element;
        }

        // $this->appendHTML($this->lastElement, $slotContent);
        $template = $this->dom->createDocumentFragment();
        $template->appendXML($slotContent);
        $this->lastElement->appendChild($template);

        return $this->dom->saveHTML();
    }

    private function extractId(string $part) : null|string
    {
        if(Str::contains($part, '#')) {
            // when starting with id like: p.#foo.test
            if(preg_match("/(?<=\#)(\w+)\.+/", $part, $match)) {
                return $match[1];
            }

            // when ending with id like: p.test#foo
            if(preg_match("/\#(\w+)\b(?!\.)$/", $part, $match)) {
                return $match[1];
            }

            [$el, $id] = explode('#', $part);

            return $id;
        }

        return null;
    }

    private function extractClass(string $part) : null|string
    {
        $items = explode('.', $part);

        if(count($items) === 1) return null;

        unset($items[0]);
        return implode(' ', $items);
    }

    private function extractCustomAttributes(string $part) : null|array
    {
        if(preg_match("/\[(.+)\]/", $part, $match)) {

            if(preg_match_all('/\s?(?P<attribute>.+?)\=(\"|\')(?P<value>.+?)(\"|\')/', $match[1], $attributeMatches)) {
                $attributes = $attributeMatches['attribute'];
                $values = $attributeMatches['value'];

                return [
                    str_replace($match[0], '', $part),
                    array_combine($attributes, $values)
                ];
            }
        }

        return null;
    }

    private function makeElement(string $part) : \DOMElement
    {
        $attributes = [];

        // extract custom attributes
        if($customAttributes = $this->extractCustomAttributes($part)) {
            [$partWithoutCustomAttributes, $customAttrDataList] = $customAttributes;
            $attributes = $customAttrDataList;

            $part = $partWithoutCustomAttributes;
        }

        // extract id
        if($id = $this->extractId($part)) {
            $attributes['id'] = $id;

            $part = str_replace('#'.$id, '', $part);
        }

        $el = $part;

        // extract class attribute
        if($class = $this->extractClass($part)) {
            $attributes['class'] = $class;

            $items = explode('.', $part);
            $el = $items[0];
        }

        $element = $this->dom->createElement($el);

        if($class) $element->setAttribute('class', $class);
        if($id) $element->setAttribute('id', $id);

        if($attributes) {
            foreach ($attributes as $key => $value) {
                $element->setAttribute($key, $value);
            }
        }

        return $element;
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.wrap');
    }
}
