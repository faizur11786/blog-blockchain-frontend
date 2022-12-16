import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';
import { Client } from '../../blog/ts-client';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import ReactJson from 'react-json-view';

function App() {
	const [tx, setTx] = useState(null);
	const [client, setClient] = useState(null);
	const [balances, setBalances] = useState(null);
	const [wallet, setWallet] = useState(null);
	const [posts, setPosts] = useState(null);
	const [comments, setComments] = useState(null);

	useEffect(() => {
		(async () => {
			const mnemonic =
				'addict stock barrel push affair snap together razor goddess rather rifle poverty beach space hood involve rib humble satisfy shoot federal mirror brain maid';

			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'blog' });

			const chain = new Client(
				{
					apiURL: 'http://localhost:1317',
					rpcURL: 'http://localhost:26657',
					prefix: 'blog',
				},
				wallet
			);
			setClient(chain);
			const accounts = await wallet.getAccounts();
			setWallet(accounts[0]);
			const balance = await chain.CosmosBankV1Beta1.query.queryAllBalances(accounts[0].address);
			setBalances(balance.data.balances);
			await loadPost(chain);
			await loadComments(chain);
			getBlock(client);
			// const tx_result = await chain.CosmosBankV1Beta1.tx.sendMsgSend({
			// 	value: {
			// 		amount: [
			// 			{
			// 				amount: '200',
			// 				denom: 'token',
			// 			},
			// 		],
			// 		fromAddress: accounts[0].address,
			// 		toAddress: 'cosmos1ak5zn0rxcq9nxuerpkvruk0vy0ughanxkqyepa',
			// 	},
			// });
			// console.log('ts_result', { tx_result });
		})();
	}, []);

	const deleteCommet = async (postID, id) => {
		if (!client) return;
		const tx = await client.BlogBlog.tx.sendMsgDeleteComment({
			value: {
				commentID: id,
				postID,
				creator: wallet.address,
			},
		});
		console.log('tx', tx);
	};

	const getBlock = async (client) => {
		await client.addListener('BeginBlock', (e) => {
			console.log('BeginBlock', e);
		});
		await client.addListener('EndBlock', (e) => {
			console.log('EndBlock', e);
		});
		await client.addListener('CheckTx', (e) => {
			console.log('CheckTx', e);
		});
		await client.addListener('DeliverTx', (e) => {
			console.log('DeliverTx', e);
		});
	};

	const sumbitHandler = async (e) => {
		e.preventDefault();
		setTx(null);
		if (!client) return;
		const form = new FormData(e.currentTarget);
		let values = {};
		for (var pair of form.entries()) {
			values[pair[0]] = pair[1];
		}
		const tx = await client.CosmosTxV1Beta1.query.serviceGetTx(values.txHash);
		setTx((pervious) => ({ ...pervious, block: tx.data }));
	};

	const loadLetestBlock = async () => {
		setTx((pervious) => ({ ...pervious, block: null }));
		if (!client) return;
		const block = await client.CosmosBaseTendermintV1Beta1.query.serviceGetLatestBlock();
		setTx((pervious) => ({ ...pervious, block: block.data }));
	};

	const loadPost = async (client) => {
		const post = await client.BlogBlog.query.queryPosts();
		if (post.data.Post) {
			post.data.Post.forEach(async (post) => {
				await loadComments(client, post.id);
			});
		}
		setPosts(post.data);
	};

	const createComment = async (e, postID) => {
		e.preventDefault();
		setTx((pervious) => ({
			...pervious,
			comment: {
				...pervious?.comment,
				[postID]: {
					isLoading: true,
				},
			},
		}));
		const form = new FormData(e.currentTarget);
		let values = new Object();
		for (let pair of form.entries()) {
			values[pair[0]] = pair[1];
		}

		const tx = await client.BlogBlog.tx.sendMsgCreateComment({
			value: {
				postID,
				...values,
				creator: wallet.address,
			},
		});
		console.log('tx', tx);
		await loadPost(client);
		setTx((pervious) => ({ ...pervious, comment: { ...pervious?.comment, [postID]: tx } }));
	};

	const trimAddres = (address) => {
		return address.slice(0, 8) + '...' + address.slice(address.length - 5, address.length);
	};
	const createPost = async (e) => {
		e.preventDefault();
		const form = new FormData(e.currentTarget);
		let values = new Object();
		for (let pair of form.entries()) {
			values[pair[0]] = pair[1];
		}

		const tx_data = client.BlogBlog.tx.msgCreatePost({
			value: {
				...values,
				creator: wallet.address,
			},
		});
		const tx = await client.signAndBroadcast([tx_data]);
		console.log('tx', tx);
		setTx((pervious) => ({ ...pervious, post: tx }));
		await loadPost(client);
	};

	const loadComments = async (client, id) => {
		if (!id || !client) return;
		const comment = await client.BlogBlog.query.queryComments(id);
		setComments((previous) => ({ ...previous, [id]: comment.data.Comment }));
	};
	// console.log('comment', comments);

	return (
		<div className='App'>
			<div style={{ marginBottom: '1rem' }}>
				{wallet && <h2>{wallet.address.toUpperCase()}</h2>}
				{balances &&
					balances.map((balance) => {
						return <h4 style={{ margin: 0 }}>{`${balance.denom.toUpperCase()}: ${balance.amount}`}</h4>;
					})}
				<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
					<form onSubmit={sumbitHandler} style={{ display: 'flex', gap: '1rem' }}>
						<input
							style={{
								padding: '0.75rem 1rem',
								border: 'none',
								minWidth: '400px',
								fontSize: '1rem',
								borderRadius: '6px',
								outline: 'none',
							}}
							type='text'
							name='txHash'
							placeholder='Enter Tx Hash.'
							id=''
						/>
						<button type='submit'>Submit</button>
					</form>
					<button onClick={loadLetestBlock}>Latest Block</button>
				</div>
			</div>

			<div>
				{tx?.block && (
					<ReactJson
						name={false}
						style={{ width: '100%' }}
						displayDataTypes={false}
						theme='apathy'
						src={tx.block}
					/>
				)}
			</div>

			<br />
			<hr />
			<br />
			<br />
			<br />

			<div>
				<h2>Create New Post</h2>
				<form onSubmit={createPost} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
					<input
						style={{
							padding: '0.75rem 1rem',
							border: 'none',
							fontSize: '1rem',
							borderRadius: '6px',
							outline: 'none',
							flex: '1',
						}}
						type='text'
						name='title'
						id=''
						placeholder='Enter post title'
					/>
					<input
						style={{
							padding: '0.75rem 1rem',
							border: 'none',
							fontSize: '1rem',
							borderRadius: '6px',
							outline: 'none',

							flex: '1',
						}}
						type='text'
						name='body'
						id=''
						placeholder='Enter post Body'
					/>
					<button type='submit'>Submit Post</button>
				</form>
				{tx?.post && (
					<ReactJson
						name={false}
						style={{ width: '100%' }}
						displayDataTypes={false}
						theme='apathy'
						src={tx.post}
					/>
				)}
			</div>

			<br />
			<hr />
			<br />
			<div>
				<h2 style={{ marginBottom: 0 }}>Posts {posts?.pagination?.total}</h2>
				<span
					style={{
						marginBottom: '1rem',
						fontSize: '0.8rem',
						fontWeight: 'bold',
						display: 'block',
						cursor: 'pointer',
						width: 'fit-content',
						color: 'blueviolet',
					}}
					onClick={() => loadPost(client)}
					sty
				>
					Reload
				</span>
				<div style={{ display: 'flex', gap: '1rem', overflow: 'auto', paddingBottom: '1.5rem' }}>
					{posts?.Post?.map((post) => (
						<div
							key={post.id}
							style={{
								border: '1px solid gray',
								padding: '1rem',
								borderRadius: '6px',
								maxWidth: '600px',
							}}
						>
							<div>
								<p>
									By{' '}
									<span
										style={{
											marginBottom: '1rem',
											fontWeight: 'bold',
											color: 'lightsalmon',
										}}
									>
										{post.creator === wallet.address
											? `You : ${trimAddres(post.creator)}`
											: trimAddres(post.creator)}
									</span>
								</p>
							</div>
							<h4 style={{ margin: 0 }}>{`${post.title ? post.title : 'NA'}`}</h4>
							<p style={{ margin: 0 }}>{`${post.body ? post.body : 'NA'}`}</p>
							<div>
								<h4>Comments</h4>
								<form
									onSubmit={(props) => createComment(props, post.id)}
									style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}
								>
									<input
										style={{
											padding: '0.75rem 1rem',
											border: 'none',
											fontSize: '1rem',
											borderRadius: '6px',
											outline: 'none',
											flex: '1',
										}}
										type='text'
										name='title'
										id=''
										placeholder='Enter comment'
									/>
									<input
										style={{
											padding: '0.75rem 1rem',
											border: 'none',
											fontSize: '1rem',
											borderRadius: '6px',
											outline: 'none',

											flex: '1',
										}}
										type='text'
										name='body'
										id=''
										placeholder='Enter comment'
									/>
									<button type='submit'>Submit</button>
								</form>
								{tx?.comment && (
									<ReactJson
										name={false}
										style={{ width: '100%' }}
										displayDataTypes={false}
										theme='apathy'
										src={tx.comment[post.id]}
									/>
								)}
								{comments && comments[post.id] && (
									<div
										style={{
											display: 'flex',
											gap: '1rem',
											overflow: 'auto',
										}}
									>
										{comments[post.id].map((comment) => (
											<div
												style={{
													marginBottom: '1rem',
													border: '1px solid gray',
													padding: '0.5rem',
													borderRadius: '6px',
													minWidth: '200px',
												}}
												key={comment.id}
											>
												<p style={{ margin: 0, marginBottom: '0.5rem' }}>
													By{' '}
													<span
														style={{
															marginBottom: '1rem',
															fontWeight: 'bold',
															color: 'lightsalmon',
														}}
													>
														{comment.creator === wallet.address
															? `You`
															: trimAddres(comment.creator)}
													</span>
												</p>
												<h4 style={{ margin: 0 }}>{comment.title}</h4>
												<p style={{ margin: 0 }}>{comment.body}</p>
												<button onClick={() => deleteCommet(post.id, comment.id)}>
													Delete
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default App;
