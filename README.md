# pure javascript 图片懒加载插件
一个纯粹的js图片懒加载插件， 浏览器兼容性为 IE>=9 以及其他的浏览器

# How to use
引入对应的js文件

```
<script src="lazyload.js"></script>
```

改写对应的html内容  
值得一提的是， 你必须指定img的宽高
```
<img data-origin="realImgUrl" width="300" height="300">
or 
<img data-origin="realImgUrl">
<style>
    img{
        width: 300px;
        height: 300px;
    }
</style>

<script>
    var img = document.querySelector('img');
    lazyload(img);
</script>
```
