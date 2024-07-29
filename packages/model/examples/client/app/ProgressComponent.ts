import { createBlock, defineComponent, h, provide, Teleport } from 'vue';

export default defineComponent({
    props: {
        context: {
            type: Object as () => { name: string; props?: Record<string, any> },
            required: true,
        },
    },
    async setup(props) {

        const components: any[] = [];
        provide('ssr-render', components);

        return () => [
            createBlock(Teleport as any, { to: 'nuxt-island' }, [h(component || 'span', props.context.props)]),
        ];
    },
});
