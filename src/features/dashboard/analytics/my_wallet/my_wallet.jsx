import { makeStyles } from "@material-ui/core"
import { useEffect, useState } from "react"
import BlocLoaderOsmosis from "../../../../components/loader/BlocLoaderOsmosis"
import Paper from "../../../../components/paper/Paper"
import { useDashboard } from "../../../../contexts/dashboard.provider"
import WalletHeader from "./wallet_header"
import WalletItem from "./wallet_item"
const useStyles = makeStyles((theme) => {
	return {
		rootMyWallet: {
			width: "100%",
			margin: "20px 0",

			[theme.breakpoints.down("xs")]: {},
		},
		title: {
			fontSize: "1.4rem",
			color: theme.palette.gray.contrastText,
			marginBottom: "20px",
		},
		loading: {
			backgroundColor: theme.palette.primary.light,
		},
		loading: {
			backgroundColor: theme.palette.primary.light,
		},
		paper: {
			position: "relative",
			height: "350px",
			overflow: "hidden",
		},
		list: {
			overflowY: "auto",
			maxHeight: "92%",
		},
	}
})
const MyWallet = () => {
	const classes = useStyles()
	const { address, getWalletInfo } = useDashboard()
	const [data, setData] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	useEffect(() => {
		const fetch = async () => {
			setIsLoading(true)
			let { balance } = await getWalletInfo({ address })
			let data = []
			if (balance.wallet) data = balance.wallet
			data.sort((a, b) => {
				return b.value - a.balance
			})
			setData(data)
			setIsLoading(false)
		}
		if (address && address.length > 0) {
			fetch()
		}
	}, [address])

	return (
		<div className={classes.rootMyWallet}>
			<p className={classes.title}>My Wallet</p>
			<Paper className={classes.paper}>
				<BlocLoaderOsmosis open={isLoading} classNameLoading={classes.loading} />
				<WalletHeader />
				<div className={classes.list}>
					{data.length === 0 ? <p>No item found</p> : null}
					{data.map((item, index) => {
						return <WalletItem key={item.denom} data={item} />
					})}
				</div>
			</Paper>
		</div>
	)
}

export default MyWallet
